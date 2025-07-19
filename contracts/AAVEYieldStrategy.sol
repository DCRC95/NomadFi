// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interfaces/IAaveV3LendingPoolAddressesProvider.sol";
import "./interfaces/IAaveV3LendingPool.sol";
import "./interfaces/IAaveV3AaveProtocolDataProvider.sol";
import "./interfaces/IAAVEYieldStrategy.sol";

contract AAVEYieldStrategy is IAAVEYieldStrategy {
    using SafeERC20 for IERC20;

    IAaveV3LendingPoolAddressesProvider public immutable AAVE_ADDRESSES_PROVIDER;
    IAaveV3LendingPool public immutable AAVE_LENDING_POOL;
    IAaveV3AaveProtocolDataProvider public immutable AAVE_DATA_PROVIDER;
    IERC20 public immutable underlyingToken;
    IERC20 public immutable aToken;

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
            // Fallback: SafeERC20.safeApprove linter issue, using approve directly
            // This is generally safe for protocol contracts like Aave
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
        return aToken.balanceOf(address(this));
    }

    function apy() external view override returns (uint256) {
        // Get reserve data from Aave Lending Pool
        IAaveV3LendingPool.ReserveData memory reserveData = AAVE_LENDING_POOL.getReserveData(address(underlyingToken));

        // currentLiquidityRate is in RAY (1e27)
        uint256 rayRate = reserveData.currentLiquidityRate;

        // Convert RAY to a value with 18 decimals for percentage display.
        // Formula: (rayRate * 1e18) / 1e27 = rayRate / 1e9
        // This gives us the APY as a value where 1.0 = 100% (with 18 decimals)
        // So, if rayRate represents 5% (0.05), the result will be 0.05 * 1e18 = 5e16
        // To get the actual percentage, the frontend will divide by 1e18 and multiply by 100.
        uint256 apyWith18Decimals = rayRate / 1e9; // 1e27 / 1e9 = 1e18 (scale factor for 100%)

        return apyWith18Decimals;
    }
} 