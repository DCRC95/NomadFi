// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract YieldAggregator is Ownable, ReentrancyGuard {
    constructor() Ownable(msg.sender) {}
    struct YieldStrategy {
        address strategyAddress;
        uint256 chainId;
        string name;
        string description;
        uint256 baseRiskScore;
        bool isActive;
        string offchainMetadataURI;
    }

    mapping(bytes32 => YieldStrategy) public strategies;
    bytes32[] public strategyIds;
    mapping(address => mapping(bytes32 => uint256)) public userDeposits;

    event StrategyAdded(
        bytes32 indexed strategyId,
        address indexed strategyAddress,
        uint256 indexed chainId,
        string name
    );
    event StrategyRemoved(bytes32 indexed strategyId);
    event DepositRecorded(address indexed user, bytes32 indexed strategyId, uint256 amount);
    event WithdrawalRecorded(address indexed user, bytes32 indexed strategyId, uint256 amount);

    function addStrategy(
        address _strategyAddress,
        uint256 _chainId,
        string memory _name,
        string memory _description,
        uint256 _baseRiskScore,
        string memory _offchainMetadataURI
    ) external onlyOwner {
        bytes32 strategyId = keccak256(abi.encodePacked(_strategyAddress, _chainId));
        require(strategies[strategyId].strategyAddress == address(0), "Strategy already exists");
        strategies[strategyId] = YieldStrategy({
            strategyAddress: _strategyAddress,
            chainId: _chainId,
            name: _name,
            description: _description,
            baseRiskScore: _baseRiskScore,
            isActive: true,
            offchainMetadataURI: _offchainMetadataURI
        });
        strategyIds.push(strategyId);
        emit StrategyAdded(strategyId, _strategyAddress, _chainId, _name);
    }

    function removeStrategy(bytes32 _strategyId) external onlyOwner {
        require(strategies[_strategyId].isActive, "Strategy not active");
        strategies[_strategyId].isActive = false;
        emit StrategyRemoved(_strategyId);
    }

    function getStrategyInfo(bytes32 _strategyId) external view returns (YieldStrategy memory) {
        return strategies[_strategyId];
    }

    /// @notice Conceptual deposit for MVP. This does NOT transfer or bridge assets; it only records the deposit for demonstration purposes.
    function deposit(bytes32 _strategyId, uint256 _amount) external nonReentrant {
        require(strategies[_strategyId].isActive, "Strategy not active");
        require(_amount > 0, "Amount must be greater than zero");
        userDeposits[msg.sender][_strategyId] += _amount;
        emit DepositRecorded(msg.sender, _strategyId, _amount);
    }

    /// @notice Conceptual withdrawal for MVP. This does NOT transfer or bridge assets; it only updates the recorded deposit for demonstration purposes.
    function withdraw(bytes32 _strategyId, uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be greater than zero");
        require(userDeposits[msg.sender][_strategyId] >= _amount, "Insufficient deposit");
        userDeposits[msg.sender][_strategyId] -= _amount;
        emit WithdrawalRecorded(msg.sender, _strategyId, _amount);
    }

    function getUserDeposit(bytes32 _strategyId, address _user) external view returns (uint256) {
        return userDeposits[_user][_strategyId];
    }

    function getAllStrategyIds() public view returns (bytes32[] memory) {
        return strategyIds;
    }
} 