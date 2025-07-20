const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Minimal ABIs for Aave V3 UI Data Providers
const UI_POOL_DATA_PROVIDER_ABI = [
  "function getReservesData(address provider) view returns (tuple(address underlyingAsset, string name, string symbol, uint256 decimals, uint256 baseLTVasCollateral, uint256 reserveLiquidationThreshold, uint256 reserveLiquidationBonus, uint256 reserveFactor, bool usageAsCollateralEnabled, bool borrowingEnabled, bool stableBorrowRateEnabled, bool isActive, bool isFrozen, uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 currentLiquidityRate, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint256 availableLiquidity, uint256 totalPrincipalStableDebt, uint256 averageStableRate, uint256 stableDebtLastUpdateTimestamp, uint256 totalScaledVariableDebt, uint256 priceInMarketReferenceCurrency, uint256 priceOracle, uint256 variableRateSlope1, uint256 variableRateSlope2, uint256 stableRateSlope1, uint256 stableRateSlope2, uint256 baseStableBorrowRate, uint256 baseVariableBorrowRate, uint256 optimalUsageRatio)[] reservesData, uint256 marketReferenceCurrencyUnit, int256 marketReferenceCurrencyPriceInUsd, uint8 networkBaseTokenPriceDecimals, uint8 marketReferenceCurrencyDecimals)"
];

async function main() {
  console.log("Testing EURS APY data from Aave V3 UI Data Providers...");

  // Load addresses.json
  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  const aaveV3Core = addresses["11155111"].aaveV3.core;
  const EURS = addresses["11155111"].aaveV3.assets.EURS.UNDERLYING;
  const EURS_DECIMALS = addresses["11155111"].aaveV3.assets.EURS.DECIMALS;
  const UI_POOL_DATA_PROVIDER = aaveV3Core.UI_POOL_DATA_PROVIDER;
  const POOL_ADDRESSES_PROVIDER = aaveV3Core.POOL_ADDRESSES_PROVIDER;

  if (!UI_POOL_DATA_PROVIDER || !POOL_ADDRESSES_PROVIDER) {
    throw new Error("Missing UI Data Provider addresses in addresses.json");
  }

  console.log(`EURS Address: ${EURS}`);
  console.log(`EURS Decimals: ${EURS_DECIMALS}`);
  console.log(`UI Pool Data Provider: ${UI_POOL_DATA_PROVIDER}`);
  console.log(`Pool Addresses Provider: ${POOL_ADDRESSES_PROVIDER}`);

  // Create contract instances
  const poolDataProvider = new hre.ethers.Contract(UI_POOL_DATA_PROVIDER, UI_POOL_DATA_PROVIDER_ABI, hre.ethers.provider);

  // Fetch all reserves data
  console.log("\nFetching reserves data...");
  const reservesResult = await poolDataProvider.getReservesData(POOL_ADDRESSES_PROVIDER);
  const reserves = reservesResult.reservesData;
  
  // Find EURS reserve
  const eursReserve = reserves.find(r => r.underlyingAsset.toLowerCase() === EURS.toLowerCase());
  if (!eursReserve) {
    console.error("EURS reserve not found in reserves data");
    console.log("Available reserves:");
    reserves.forEach(r => {
      console.log(`  ${r.symbol}: ${r.underlyingAsset}`);
    });
    return;
  }

  // Print EURS reserve data
  console.log("\n--- EURS Reserve Data ---");
  console.log(`Symbol: ${eursReserve.symbol}`);
  console.log(`Underlying Asset: ${eursReserve.underlyingAsset}`);
  console.log(`Decimals: ${eursReserve.decimals}`);
  console.log(`Is Active: ${eursReserve.isActive}`);
  console.log(`Is Frozen: ${eursReserve.isFrozen}`);

  // Calculate and print APY
  const liquidityRateRay = eursReserve.currentLiquidityRate;
  const supplyAPR = Number(hre.ethers.formatUnits(liquidityRateRay, 27));
  const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
  const supplyAPY = (Math.pow(1 + supplyAPR / SECONDS_PER_YEAR, SECONDS_PER_YEAR) - 1) * 100;
  const availableLiquidity = hre.ethers.formatUnits(eursReserve.availableLiquidity, EURS_DECIMALS);

  console.log("\n--- EURS APY Calculation ---");
  console.log(`Liquidity Rate (Ray): ${liquidityRateRay.toString()}`);
  console.log(`Supply APR (decimal): ${supplyAPR}`);
  console.log(`Supply APY (%): ${supplyAPY.toFixed(4)}%`);
  console.log(`Available Liquidity: ${availableLiquidity} EURS`);

  // Check if APY is close to expected 2.81%
  const expectedAPY = 2.81;
  const tolerance = 0.5; // 0.5% tolerance
  const difference = Math.abs(supplyAPY - expectedAPY);
  
  console.log("\n--- APY Verification ---");
  console.log(`Expected APY: ${expectedAPY}%`);
  console.log(`Actual APY: ${supplyAPY.toFixed(4)}%`);
  console.log(`Difference: ${difference.toFixed(4)}%`);
  console.log(`Tolerance: ±${tolerance}%`);
  
  if (difference <= tolerance) {
    console.log("✅ APY is within expected range!");
  } else {
    console.log("❌ APY is outside expected range");
  }

  // Test the mapping logic from the frontend hook
  console.log("\n--- Testing Frontend Mapping Logic ---");
  const strategyNames = [
    "AaveV3EURSStrategy",
    "EURS Strategy",
    "Aave EURS Strategy",
    "Some other strategy"
  ];

  strategyNames.forEach(strategyName => {
    const strategyNameLower = strategyName.toLowerCase();
    let aaveAssetAddress = EURS; // default
    
    if (strategyNameLower.includes('aavev3eurs') || strategyNameLower.includes('eurs')) {
      aaveAssetAddress = addresses["11155111"].aaveV3.assets.EURS.UNDERLYING;
      console.log(`✅ Strategy "${strategyName}" -> EURS address: ${aaveAssetAddress}`);
    } else {
      console.log(`❌ Strategy "${strategyName}" -> No EURS mapping found`);
    }
  });
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✅ EURS APY test completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ EURS APY test failed:", error);
      process.exit(1);
    });
} 