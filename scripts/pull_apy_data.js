const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Minimal ABIs for Aave V3 UI Data Providers
const UI_POOL_DATA_PROVIDER_ABI = [
  "function getReservesData(address provider) view returns (tuple(address underlyingAsset, string name, string symbol, uint256 decimals, uint256 baseLTVasCollateral, uint256 reserveLiquidationThreshold, uint256 reserveLiquidationBonus, uint256 reserveFactor, bool usageAsCollateralEnabled, bool borrowingEnabled, bool stableBorrowRateEnabled, bool isActive, bool isFrozen, uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 currentLiquidityRate, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint256 availableLiquidity, uint256 totalPrincipalStableDebt, uint256 averageStableRate, uint256 stableDebtLastUpdateTimestamp, uint256 totalScaledVariableDebt, uint256 priceInMarketReferenceCurrency, uint256 priceOracle, uint256 variableRateSlope1, uint256 variableRateSlope2, uint256 stableRateSlope1, uint256 stableRateSlope2, uint256 baseStableBorrowRate, uint256 baseVariableBorrowRate, uint256 optimalUsageRatio)[] reservesData, uint256 marketReferenceCurrencyUnit, int256 marketReferenceCurrencyPriceInUsd, uint8 networkBaseTokenPriceDecimals, uint8 marketReferenceCurrencyDecimals)"
];

const UI_INCENTIVE_DATA_PROVIDER_ABI = [
  "function getFullReservesIncentiveData(address provider) view returns (tuple(address underlyingAsset, tuple(address tokenAddress, tuple(address rewardTokenAddress, string rewardTokenSymbol, address rewardOracleAddress, uint256 emissionPerSecond, uint256 incentivesLastUpdateTimestamp, uint256 tokenIncentivesIndex, uint256 emissionEndTimestamp, address rewardTokenDecimals, address precision, uint256 rewardTokenPrice, uint256 rewardTokenPriceDecimals, uint256 aIncentiveAPR)[] rewardsTokenInfo) aIncentivesData, tuple(address tokenAddress, tuple(address rewardTokenAddress, string rewardTokenSymbol, address rewardOracleAddress, uint256 emissionPerSecond, uint256 incentivesLastUpdateTimestamp, uint256 tokenIncentivesIndex, uint256 emissionEndTimestamp, address rewardTokenDecimals, address precision, uint256 rewardTokenPrice, uint256 rewardTokenPriceDecimals, uint256 vIncentiveAPR)[] rewardsTokenInfo) vIncentivesData, tuple(address tokenAddress, tuple(address rewardTokenAddress, string rewardTokenSymbol, address rewardOracleAddress, uint256 emissionPerSecond, uint256 incentivesLastUpdateTimestamp, uint256 tokenIncentivesIndex, uint256 emissionEndTimestamp, address rewardTokenDecimals, address precision, uint256 rewardTokenPrice, uint256 rewardTokenPriceDecimals, uint256 sIncentiveAPR)[] rewardsTokenInfo) sIncentivesData)[] reservesIncentiveData)"
];

async function main() {
  console.log("Pulling APY and incentive data for LINK on Sepolia using Aave V3 UI Data Providers...");

  // Load addresses.json
  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  const aaveV3Core = addresses["11155111"].aaveV3.core;
  const LINK = addresses["11155111"].aaveV3.assets.LINK.UNDERLYING;
  const LINK_DECIMALS = addresses["11155111"].aaveV3.assets.LINK.DECIMALS;
  const UI_POOL_DATA_PROVIDER = aaveV3Core.UI_POOL_DATA_PROVIDER;
  const UI_INCENTIVE_DATA_PROVIDER = aaveV3Core.UI_INCENTIVE_DATA_PROVIDER;
  const POOL_ADDRESSES_PROVIDER = aaveV3Core.POOL_ADDRESSES_PROVIDER;

  if (!UI_POOL_DATA_PROVIDER || !UI_INCENTIVE_DATA_PROVIDER) {
    throw new Error("Missing UI Data Provider addresses in addresses.json");
  }

  // Create contract instances
  const poolDataProvider = new hre.ethers.Contract(UI_POOL_DATA_PROVIDER, UI_POOL_DATA_PROVIDER_ABI, hre.ethers.provider);
  const incentiveDataProvider = new hre.ethers.Contract(UI_INCENTIVE_DATA_PROVIDER, UI_INCENTIVE_DATA_PROVIDER_ABI, hre.ethers.provider);

  // Fetch all reserves data
  const reservesResult = await poolDataProvider.getReservesData(POOL_ADDRESSES_PROVIDER);
  const reserves = reservesResult.reservesData;
  // Find LINK reserve
  const linkReserve = reserves.find(r => r.underlyingAsset.toLowerCase() === LINK.toLowerCase());
  if (!linkReserve) {
    throw new Error("LINK reserve not found in reserves data");
  }

  // Print base supply APY info
  const liquidityRateRay = linkReserve.currentLiquidityRate;
  const supplyAPR = Number(hre.ethers.formatUnits(liquidityRateRay, 27));
  const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
  const supplyAPY = (Math.pow(1 + supplyAPR / SECONDS_PER_YEAR, SECONDS_PER_YEAR) - 1) * 100;
  const availableLiquidity = hre.ethers.formatUnits(linkReserve.availableLiquidity, LINK_DECIMALS);

  console.log("\n--- LINK Reserve Data ---");
  console.log(`Supply APR (decimal): ${supplyAPR}`);
  console.log(`Supply APY (%): ${supplyAPY.toFixed(4)}`);
  console.log(`Available Liquidity: ${availableLiquidity} LINK`);

  // Fetch all incentives data
  const incentivesResult = await incentiveDataProvider.getFullReservesIncentiveData(POOL_ADDRESSES_PROVIDER);
  const reservesIncentiveData = incentivesResult.reservesIncentiveData;
  // Find LINK incentives
  const linkIncentives = reservesIncentiveData.find(r => r.underlyingAsset.toLowerCase() === LINK.toLowerCase());
  if (!linkIncentives) {
    throw new Error("LINK incentives not found in incentives data");
  }

  // Print aToken incentives info (if available)
  if (linkIncentives.aIncentivesData && linkIncentives.aIncentivesData.rewardsTokenInfo && linkIncentives.aIncentivesData.rewardsTokenInfo.length > 0) {
    for (const reward of linkIncentives.aIncentivesData.rewardsTokenInfo) {
      const emissionPerSecond = hre.ethers.formatUnits(reward.emissionPerSecond || 0, reward.rewardTokenDecimals || 18);
      const rewardTokenPrice = reward.rewardTokenPrice ? hre.ethers.formatUnits(reward.rewardTokenPrice, reward.rewardTokenPriceDecimals || 8) : '0';
      const apr = reward.aIncentiveAPR ? hre.ethers.formatUnits(reward.aIncentiveAPR, 27) : '0';
      console.log("\n--- LINK aToken Incentive ---");
      console.log(`Reward Token: ${reward.rewardTokenSymbol} (${reward.rewardTokenAddress})`);
      console.log(`Emission Per Second: ${emissionPerSecond}`);
      console.log(`Reward Token Price (USD): ${rewardTokenPrice}`);
      console.log(`Incentive APR (decimal): ${apr}`);
    }
  } else {
    console.log("No aToken incentives for LINK found.");
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✅ APY and incentive data pull completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ APY and incentive data pull failed:", error);
      process.exit(1);
    });
}
