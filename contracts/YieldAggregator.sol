// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "contracts/interfaces/IAAVEYieldStrategy.sol";

contract YieldAggregator is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum StrategyType { Mock, Aave }

    struct StrategyInfo {
        address tokenAddress;
        address strategyAddress;
        string name;
        StrategyType strategyType;
        bool isActive;
    }

    mapping(uint256 => StrategyInfo) public strategies;
    uint256[] public strategyIds;
    // user => token => strategyId => amount
    mapping(address => mapping(address => mapping(uint256 => uint256))) public userDeposits;
    // Whitelisted tokens
    mapping(address => bool) public isSupportedToken;

    event TokenSupported(address indexed tokenAddress);
    event TokenUnSupported(address indexed tokenAddress);
    event StrategyAdded(
        uint256 indexed id,
        address indexed tokenAddress,
        address strategyAddress,
        string name,
        StrategyType strategyType
    );
    event StrategyRemoved(uint256 indexed strategyId);
    event Deposit(address indexed user, address indexed token, uint256 amount, uint256 indexed strategyId, uint256 timestamp);
    event Withdrawal(address indexed user, address indexed token, uint256 amount, uint256 indexed strategyId, uint256 timestamp);

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

    function addStrategy(
        uint256 _id,
        address _tokenAddress,
        address _strategyAddress,
        string memory _name,
        StrategyType _strategyType
    ) public onlyOwner {
        strategies[_id] = StrategyInfo({
            tokenAddress: _tokenAddress,
            strategyAddress: _strategyAddress,
            name: _name,
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

    function getStrategyInfo(uint256 _strategyId) external view returns (StrategyInfo memory) {
        return strategies[_strategyId];
    }

    function getStrategyAPY(uint256 _strategyId) public view returns (uint256) {
        StrategyInfo storage strategyInfo = strategies[_strategyId];
        if (strategyInfo.strategyType == StrategyType.Aave) {
            return IAAVEYieldStrategy(strategyInfo.strategyAddress).apy();
        } else if (strategyInfo.strategyType == StrategyType.Mock) {
            // Assuming IMockYieldStrategy is defined elsewhere or will be added
            // For now, returning a placeholder or throwing an error if not implemented
            // revert("Unknown strategy type"); // Original code had this line commented out
            return 0; // Placeholder for Mock strategy APY
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

        StrategyInfo storage strategyInfo = strategies[_strategyId];
        if (strategyInfo.strategyType == StrategyType.Aave) {
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

        StrategyInfo storage strategyInfo = strategies[_strategyId];
        if (strategyInfo.strategyType == StrategyType.Aave) {
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
} 