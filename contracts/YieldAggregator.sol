// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "contracts/interfaces/IAAVEYieldStrategy.sol";
import "contracts/interfaces/IMockYieldStrategy.sol";
import "contracts/interfaces/IYieldAggregator.sol";

contract YieldAggregator is Ownable, ReentrancyGuard, IYieldAggregator {
    using SafeERC20 for IERC20;

    constructor(address[] memory _initialSupportedTokens) Ownable(msg.sender) {
        for (uint256 i = 0; i < _initialSupportedTokens.length; i++) {
            isSupportedToken[_initialSupportedTokens[i]] = true;
            emit TokenSupported(_initialSupportedTokens[i]);
        }
    }

    function addSupportedToken(address _tokenAddress) public onlyOwner {
        isSupportedToken[_tokenAddress] = true;
        emit TokenSupported(_tokenAddress);
    }

    function removeSupportedToken(address _tokenAddress) public onlyOwner {
        isSupportedToken[_tokenAddress] = false;
        emit TokenUnSupported(_tokenAddress);
    }

    mapping(uint256 => IYieldAggregator.StrategyInfo) public strategies;
    uint256[] public strategyIds;
    // user => token => strategyId => amount
    mapping(address => mapping(address => mapping(uint256 => uint256))) public userDeposits;
    // Whitelisted tokens
    mapping(address => bool) public isSupportedToken;

    function addStrategy(
        uint256 _id,
        address _tokenAddress,
        address _strategyAddress,
        string memory _name,
        uint256 _chainId,
        IYieldAggregator.StrategyType _strategyType
    ) public onlyOwner {
        strategies[_id] = IYieldAggregator.StrategyInfo({
            tokenAddress: _tokenAddress,
            strategyAddress: _strategyAddress,
            name: _name,
            chainId: _chainId,
            strategyType: _strategyType,
            isActive: true
        });
        strategyIds.push(_id);
        emit StrategyAdded(_id, _tokenAddress, _strategyAddress, _name, _strategyType);
    }

    function removeStrategy(uint256 _strategyId) external onlyOwner {
        require(strategies[_strategyId].isActive, "Strategy not active");
        strategies[_strategyId].isActive = false;
        emit StrategyRemoved(_strategyId);
    }

    function getStrategyInfo(uint256 _strategyId) external view override returns (IYieldAggregator.StrategyInfo memory) {
        return strategies[_strategyId];
    }

    function getStrategyAPY(uint256 _strategyId) public view override returns (uint256) {
        IYieldAggregator.StrategyInfo storage strategyInfo = strategies[_strategyId];
        if (strategyInfo.strategyType == IYieldAggregator.StrategyType.Aave) {
            try IAAVEYieldStrategy(strategyInfo.strategyAddress).apy() returns (uint256 apyValue) {
                return apyValue;
            } catch {
                return 0; // Fallback if APY call fails
            }
        } else if (strategyInfo.strategyType == IYieldAggregator.StrategyType.Mock) {
            try IMockYieldStrategy(strategyInfo.strategyAddress).getAPY() returns (uint256 apyValue) {
                return apyValue;
            } catch {
                return 0; // Fallback if APY call fails
            }
        } else {
            revert("Unknown strategy type");
        }
    }

    /// @notice Secure ERC-20 deposit. Transfers tokens and records deposit.
    function deposit(address _tokenAddress, uint256 _amount, uint256 _strategyId) public nonReentrant {
        require(strategies[_strategyId].isActive, "Strategy not active");
        require(_amount > 0, "Amount must be greater than zero");
        require(isSupportedToken[_tokenAddress], "YieldAggregator: Unsupported token");
        IERC20(_tokenAddress).safeTransferFrom(msg.sender, address(this), _amount);
        userDeposits[msg.sender][_tokenAddress][_strategyId] += _amount;
        emit Deposit(msg.sender, _tokenAddress, _amount, _strategyId, block.timestamp);

        IYieldAggregator.StrategyInfo storage strategyInfo = strategies[_strategyId];
        if (strategyInfo.strategyType == IYieldAggregator.StrategyType.Aave) {
            // Forward tokens to the AAVEYieldStrategy contract
            IERC20(_tokenAddress).safeTransfer(strategyInfo.strategyAddress, _amount);
            // Tell the strategy to deposit to Aave
            IAAVEYieldStrategy(strategyInfo.strategyAddress).depositToProtocol(_amount);
        }
        // For Mock strategies, do nothing extra
    }

    /// @notice Secure ERC-20 withdrawal. Transfers tokens back to user and updates deposit record.
    function withdraw(address _tokenAddress, uint256 _amount, uint256 _strategyId) public nonReentrant {
        require(_amount > 0, "Amount must be greater than zero");
        require(userDeposits[msg.sender][_tokenAddress][_strategyId] >= _amount, "YieldAggregator: Insufficient deposited balance");

        IYieldAggregator.StrategyInfo storage strategyInfo = strategies[_strategyId];
        if (strategyInfo.strategyType == IYieldAggregator.StrategyType.Aave) {
            // Withdraw from AAVEYieldStrategy to this contract
            IAAVEYieldStrategy(strategyInfo.strategyAddress).withdrawFromProtocol(_amount, address(this));
        }
        // For Mock strategies, do nothing extra

        userDeposits[msg.sender][_tokenAddress][_strategyId] -= _amount;
        IERC20(_tokenAddress).safeTransfer(msg.sender, _amount);
        emit Withdrawal(msg.sender, _tokenAddress, _amount, _strategyId, block.timestamp);
    }

    function getUserDeposit(uint256 _strategyId, address _user, address _tokenAddress) external view returns (uint256) {
        return userDeposits[_user][_tokenAddress][_strategyId];
    }

    function getAllStrategyIds() public view returns (uint256[] memory) {
        return strategyIds;
    }

    // Comprehensive Data Functions
    function getStrategyData(uint256 _strategyId) external view override returns (StrategyData memory) {
        StrategyInfo memory strategy = strategies[_strategyId];
        
        // Get APY from strategy contract with error handling
        uint256 strategyApy = 0;
        if (strategy.strategyType == StrategyType.Aave) {
            try IAAVEYieldStrategy(strategy.strategyAddress).apy() returns (uint256 apyValue) {
                strategyApy = apyValue;
            } catch {
                strategyApy = 0; // Fallback if APY call fails
            }
        } else if (strategy.strategyType == StrategyType.Mock) {
            try IMockYieldStrategy(strategy.strategyAddress).getAPY() returns (uint256 apyValue) {
                strategyApy = apyValue;
            } catch {
                strategyApy = 0; // Fallback if APY call fails
            }
        }
        
        // Calculate total deposits for this strategy
        uint256 totalDeposits = 0;
        for (uint256 i = 0; i < strategyIds.length; i++) {
            if (strategyIds[i] == _strategyId) {
                // Sum all user deposits for this strategy
                // This is a simplified calculation - in production you might want to track this separately
                totalDeposits = 0; // Placeholder - would need to iterate through all users
                break;
            }
        }
        
        return StrategyData({
            tokenAddress: strategy.tokenAddress,
            strategyAddress: strategy.strategyAddress,
            name: strategy.name,
            chainId: strategy.chainId,
            strategyType: strategy.strategyType,
            isActive: strategy.isActive,
            apy: strategyApy,
            totalDeposits: totalDeposits,
            totalValueLocked: totalDeposits // Simplified - in production this would include accrued interest
        });
    }

    function getUserData(address _user, uint256 _strategyId) external view override returns (UserData memory) {
        StrategyInfo memory strategy = strategies[_strategyId];
        
        // Get token balance
        uint256 balance = IERC20(strategy.tokenAddress).balanceOf(_user);
        
        // Get allowance
        uint256 allowance = IERC20(strategy.tokenAddress).allowance(_user, address(this));
        
        // Get deposited amount
        uint256 depositedAmount = userDeposits[_user][strategy.tokenAddress][_strategyId];
        
        // Determine if approval is needed (simplified logic)
        bool needsApproval = allowance < depositedAmount;
        
        return UserData({
            balance: balance,
            allowance: allowance,
            depositedAmount: depositedAmount,
            needsApproval: needsApproval
        });
    }

    function getBatchUserData(address _user, uint256[] calldata _strategyIds) external view override returns (UserData[] memory) {
        UserData[] memory userDataArray = new UserData[](_strategyIds.length);
        
        for (uint256 i = 0; i < _strategyIds.length; i++) {
            userDataArray[i] = this.getUserData(_user, _strategyIds[i]);
        }
        
        return userDataArray;
    }

    function getBatchStrategyData(uint256[] calldata _strategyIds) external view override returns (StrategyData[] memory) {
        StrategyData[] memory strategyDataArray = new StrategyData[](_strategyIds.length);
        
        for (uint256 i = 0; i < _strategyIds.length; i++) {
            strategyDataArray[i] = this.getStrategyData(_strategyIds[i]);
        }
        
        return strategyDataArray;
    }
}