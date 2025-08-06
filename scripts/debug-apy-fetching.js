const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function testAaveAPYFetching(chainId, tokenAddress, strategyName) {
  console.log(`Testing APY for ${strategyName}`);
  console.log(`Chain ID: ${chainId}`);
  console.log(`Token Address: ${tokenAddress}`);
  console.log(`Strategy Name: ${strategyName}`);

  try {
    const addressesPath = path.join(__dirname, "../constants/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
    const chainAddresses = addresses[chainId];
    
    if (!chainAddresses?.aaveV3?.core) {
      throw new Error(`No Aave V3 configuration found for chain ${chainId}`);
    }

    const { UI_POOL_DATA_PROVIDER, POOL_ADDRESSES_PROVIDER } = chainAddresses.aaveV3.core;
    if (!UI_POOL_DATA_PROVIDER || !POOL_ADDRESSES_PROVIDER) {
      throw new Error(`Missing UI Pool Data Provider addresses for chain ${chainId}`);
    }

    let aaveAssetAddress = tokenAddress;
    if (chainAddresses.aaveV3?.assets && strategyName) {
      const strategyNameLower = strategyName.toLowerCase();
      
      console.log(`Strategy name (lowercase): ${strategyNameLower}`);
      
      if (strategyNameLower.includes('aavev3link') || strategyNameLower.includes('link')) {
        aaveAssetAddress = chainAddresses.aaveV3.assets.LINK.UNDERLYING;
        console.log(`Mapped to LINK: ${aaveAssetAddress}`);
      } else if (strategyNameLower.includes('aavev3wbtc') || strategyNameLower.includes('wbtc')) {
        aaveAssetAddress = chainAddresses.aaveV3.assets.WBTC.UNDERLYING;
        console.log(`Mapped to WBTC: ${aaveAssetAddress}`);
      } else if (strategyNameLower.includes('aavev3eurs') || strategyNameLower.includes('eurs')) {
        aaveAssetAddress = chainAddresses.aaveV3.assets.EURS.UNDERLYING;
        console.log(`Mapped to EURS: ${aaveAssetAddress}`);
      } else if (strategyNameLower.includes('aavev3aave') || strategyNameLower.includes('aave')) {
        aaveAssetAddress = chainAddresses.aaveV3.assets.AAVE.UNDERLYING;
        console.log(`Mapped to AAVE: ${aaveAssetAddress}`);
      } else {
        console.log(`No mapping found, using original token address: ${aaveAssetAddress}`);
      }
    }

    const rpcUrl = chainId === '11155111' 
      ? 'https://ethereum-sepolia.publicnode.com'
      : 'https://ethereum.publicnode.com';
    
    const provider = new hre.ethers.JsonRpcProvider(rpcUrl);
    
    const UI_POOL_DATA_PROVIDER_ABI = [
      "function getReservesData(address provider) view returns (tuple(address underlyingAsset, string name, string symbol, uint256 decimals, uint256 baseLTVasCollateral, uint256 reserveLiquidationThreshold, uint256 reserveLiquidationBonus, uint256 reserveFactor, bool usageAsCollateralEnabled, bool borrowingEnabled, bool stableBorrowRateEnabled, bool isActive, bool isFrozen, uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 currentLiquidityRate, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint256 availableLiquidity, uint256 totalPrincipalStableDebt, uint256 averageStableRate, uint256 stableDebtLastUpdateTimestamp, uint256 totalScaledVariableDebt, uint256 priceInMarketReferenceCurrency, uint256 priceOracle, uint256 variableRateSlope1, uint256 variableRateSlope2, uint256 stableRateSlope1, uint256 stableRateSlope2, uint256 baseStableBorrowRate, uint256 baseVariableBorrowRate, uint256 optimalUsageRatio)[] reservesData, uint256 marketReferenceCurrencyUnit, int256 marketReferenceCurrencyPriceInUsd, uint8 networkBaseTokenPriceDecimals, uint8 marketReferenceCurrencyDecimals)"
    ];
    
    const poolDataProvider = new hre.ethers.Contract(UI_POOL_DATA_PROVIDER, UI_POOL_DATA_PROVIDER_ABI, provider);

    console.log(`Fetching reserves data...`);
    const reservesResult = await poolDataProvider.getReservesData(POOL_ADDRESSES_PROVIDER);
    const reserves = reservesResult.reservesData;

    const reserve = reserves.find((r) => 
      r.underlyingAsset.toLowerCase() === aaveAssetAddress.toLowerCase()
    );

    if (!reserve) {
      console.error(`Token ${aaveAssetAddress} not found in Aave reserves`);
      console.log("Available reserves:");
      reserves.forEach((r) => {
        console.log(`  ${r.symbol}: ${r.underlyingAsset}`);
      });
      return null;
    }

    console.log(`Found reserve: ${reserve.symbol} (${reserve.underlyingAsset})`);
    console.log(`Reserve is active: ${reserve.isActive}`);

    const liquidityRateRay = reserve.currentLiquidityRate;
    const supplyAPR = Number(hre.ethers.formatUnits(liquidityRateRay, 27));
    const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
    const supplyAPY = (Math.pow(1 + supplyAPR / SECONDS_PER_YEAR, SECONDS_PER_YEAR) - 1) * 100;

    console.log(`Liquidity Rate (Ray): ${liquidityRateRay.toString()}`);
    console.log(`Supply APR (decimal): ${supplyAPR}`);
    console.log(`Supply APY (%): ${supplyAPY.toFixed(4)}%`);

    return supplyAPY;
  } catch (err) {
    console.error(`Error fetching APY for ${strategyName}:`, err.message);
    return null;
  }
}

async function main() {
  console.log("Debugging APY fetching for all Aave strategies...");

  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
  const sepoliaConfig = addresses['11155111'];

  const testStrategies = [
    {
      name: "AaveV3LINKStrategy",
      tokenAddress: sepoliaConfig.aaveV3.assets.LINK.UNDERLYING,
      chainId: "11155111"
    },
    {
      name: "AaveV3WBTCStrategy", 
      tokenAddress: sepoliaConfig.aaveV3.assets.WBTC.UNDERLYING,
      chainId: "11155111"
    },
    {
      name: "AaveV3AAVEStrategy",
      tokenAddress: sepoliaConfig.aaveV3.assets.AAVE.UNDERLYING,
      chainId: "11155111"
    },
    {
      name: "AaveV3EURSStrategy",
      tokenAddress: sepoliaConfig.aaveV3.assets.EURS.UNDERLYING,
      chainId: "11155111"
    }
  ];

  const results = [];

  for (const strategy of testStrategies) {
    const apy = await testAaveAPYFetching(
      strategy.chainId, 
      strategy.tokenAddress, 
      strategy.name
    );
    
    results.push({
      name: strategy.name,
      apy: apy,
      success: apy !== null
    });
  }

  console.log("\n=== APY Fetching Summary ===");
  results.forEach(result => {
    const status = result.success ? "✅" : "❌";
    const apyText = result.success ? `${result.apy.toFixed(4)}%` : "Failed";
    console.log(`${status} ${result.name}: ${apyText}`);
  });

  const successCount = results.filter(r => r.success).length;
  console.log(`\nSuccess rate: ${successCount}/${results.length} (${(successCount/results.length*100).toFixed(1)}%)`);
}

main()
  .then(() => {
    console.log("\n🎉 APY debugging completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ APY debugging failed:", error);
    process.exit(1);
  }); 