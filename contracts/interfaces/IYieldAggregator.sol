// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IYieldAggregator {
    enum StrategyType { Mock, Aave }

    struct StrategyInfo {
        address tokenAddress;
        address strategyAddress;
        string name;
        uint256 chainId; // Explicitly link to chain
        StrategyType strategyType;
        bool isActive;
    }

    struct StrategyData {
        address tokenAddress;
        address strategyAddress;
        string name;
        uint256 chainId;
        StrategyType strategyType;
        bool isActive;
        uint256 apy;
        uint256 totalDeposits;
        uint256 totalValueLocked;
    }

    struct UserData {
        uint256 balance;
        uint256 allowance;
        uint256 depositedAmount;
        bool needsApproval;
    }

    // Events
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

    // Core Functions
    function addSupportedToken(address _tokenAddress) external;
    function removeSupportedToken(address _tokenAddress) external;
    function addStrategy(
        uint256 _id,
        address _tokenAddress,
        address _strategyAddress,
        string memory _name,
        uint256 _chainId,
        StrategyType _strategyType
    ) external;
    function removeStrategy(uint256 _strategyId) external;
    function getStrategyInfo(uint256 _strategyId) external view returns (StrategyInfo memory);
    function getStrategyAPY(uint256 _strategyId) external view returns (uint256);
    function deposit(address _tokenAddress, uint256 _amount, uint256 _strategyId) external;
    function withdraw(address _tokenAddress, uint256 _amount, uint256 _strategyId) external;
    function getUserDeposit(uint256 _strategyId, address _user, address _tokenAddress) external view returns (uint256);
    function getAllStrategyIds() external view returns (uint256[] memory);

    // New Comprehensive Data Functions
    function getStrategyData(uint256 _strategyId) external view returns (StrategyData memory);
    function getUserData(address _user, uint256 _strategyId) external view returns (UserData memory);
    function getBatchUserData(address _user, uint256[] calldata _strategyIds) external view returns (UserData[] memory);
    function getBatchStrategyData(uint256[] calldata _strategyIds) external view returns (StrategyData[] memory);
} 