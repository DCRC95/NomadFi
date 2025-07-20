// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interfaces/IAaveV3LendingPoolAddressesProvider.sol";
import "./interfaces/IAaveV3LendingPool.sol";
import "./interfaces/IAaveV3AaveProtocolDataProvider.sol";
import "./interfaces/IAAVEYieldStrategy.sol";

// Ensure AAVEYieldStrategy implements the universal IYieldStrategy
contract AAVEYieldStrategy is IAAVEYieldStrategy {
    using SafeERC20 for IERC20;

    IAaveV3LendingPoolAddressesProvider public immutable AAVE_ADDRESSES_PROVIDER;
    IAaveV3LendingPool public immutable AAVE_LENDING_POOL;
    IAaveV3AaveProtocolDataProvider public immutable AAVE_DATA_PROVIDER;
    IERC20 public immutable underlyingToken;
    IERC20 public immutable aToken;

    // Seconds in a year (approx. 365 days * 24 hours * 60 minutes * 60 seconds)
    uint256 private constant SECONDS_PER_YEAR = 31536000;

    constructor(
        address _aaveAddressesProvider,
        address _underlyingToken,
        address _aToken
    ) {
        require(_aaveAddressesProvider != address(0), "AAVEYieldStrategy: provider address is zero");
        require(_underlyingToken != address(0), "AAVEYieldStrategy: underlying token address is zero");
        require(_aToken != address(0), "AAVEYieldStrategy: aToken address is zero");

        AAVE_ADDRESSES_PROVIDER = IAaveV3LendingPoolAddressesProvider(_aaveAddressesProvider);
        underlyingToken = IERC20(_underlyingToken);
        aToken = IERC20(_aToken);

        address poolAddr = IAaveV3LendingPoolAddressesProvider(_aaveAddressesProvider).getPool();
        require(poolAddr != address(0), "AAVEYieldStrategy: getPool returned zero");
        AAVE_LENDING_POOL = IAaveV3LendingPool(poolAddr);

        address dataProviderAddr = IAaveV3LendingPoolAddressesProvider(_aaveAddressesProvider).getPoolDataProvider();
        require(dataProviderAddr != address(0), "AAVEYieldStrategy: getPoolDataProvider returned zero");
        AAVE_DATA_PROVIDER = IAaveV3AaveProtocolDataProvider(dataProviderAddr);
    }

    function depositToProtocol(uint256 amount) external returns (bool success) {
        require(amount > 0, "Amount must be greater than zero");
        uint256 allowance = underlyingToken.allowance(address(this), address(AAVE_LENDING_POOL));
        if (allowance < amount) {
            // Approve the Aave Lending Pool to spend tokens from this strategy
            underlyingToken.approve(address(AAVE_LENDING_POOL), type(uint256).max);
        }
        // Deposit into Aave V3
        AAVE_LENDING_POOL.supply(address(underlyingToken), amount, address(this), 0);
        return true;
    }

    function withdrawFromProtocol(uint256 amount, address to) external returns (bool success) {
        require(amount > 0 || amount == type(uint256).max, "Amount must be greater than zero or max");
        require(to != address(0), "Invalid recipient address");
        // Withdraw from Aave V3 to the specified address
        AAVE_LENDING_POOL.withdraw(address(underlyingToken), amount, to);
        return true;
    }

    function getCurrentBalance() external view override returns (uint256) {
        // Returns the amount of aTokens held by this strategy, which represents the supplied balance
        return aToken.balanceOf(address(this));
    }

    function getTotalSupply() external view returns (uint256) {
        // Returns the total supply of aTokens, which represents the total TVL for this asset on Aave
        return aToken.totalSupply();
    }

    function apy() external view override returns (uint256) {
        // Get reserve data from Aave Lending Pool
        // Note: Aave's getReserveData returns a ReserveData struct.
        IAaveV3AaveProtocolDataProvider.ReserveData memory reserveData = AAVE_DATA_PROVIDER.getReserveData(address(underlyingToken));

        // Convert RAY (1e27) scaled rate to 18 decimals and annualize.
        // Formula: (rate_per_second_1e27 / 1e9) * SECONDS_PER_YEAR
        // This converts the rate to 1e18 scale and then annualizes it.
        // The result is the APY scaled by 1e18, where 1.0 * 1e18 represents 100%.
        uint256 apyWith18Decimals = (reserveData.liquidityRate / (10**9)) * SECONDS_PER_YEAR;

        return apyWith18Decimals;
    }
}