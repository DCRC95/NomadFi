// scripts/test-wbtc-apy.js
// Test script to check WBTC strategy APY

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Testing WBTC Strategy APY...");
  
  // Load addresses.json
  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  
  // Get WBTC strategy address
  const wbtcStrategyAddress = addresses["11155111"].deployedContracts?.AaveV3WBTCStrategy;
  if (!wbtcStrategyAddress) {
    throw new Error('WBTC strategy address not found');
  }
  
  console.log(`WBTC Strategy Address: ${wbtcStrategyAddress}`);
  
  // Get WBTC token address
  const wbtcTokenAddress = addresses["11155111"].aaveV3?.assets?.WBTC?.UNDERLYING;
  console.log(`WBTC Token Address: ${wbtcTokenAddress}`);
  
  // Get YieldAggregator address
  const yieldAggregatorAddress = addresses["11155111"].deployedContracts?.YieldAggregator;
  console.log(`YieldAggregator Address: ${yieldAggregatorAddress}`);
  
  // Get YieldAggregator contract
  const YieldAggregator = await hre.ethers.getContractFactory("YieldAggregator");
  const yieldAggregator = YieldAggregator.attach(yieldAggregatorAddress);
  
  // Get AAVEYieldStrategy contract
  const AAVEYieldStrategy = await hre.ethers.getContractFactory("AAVEYieldStrategy");
  const wbtcStrategy = AAVEYieldStrategy.attach(wbtcStrategyAddress);
  
  console.log("\n=== Testing APY Calls ===");
  
  // Test 1: Get APY directly from WBTC strategy
  try {
    console.log("\n1. Direct APY call to WBTC strategy:");
    const directApy = await wbtcStrategy.apy();
    console.log(`   Raw APY: ${directApy.toString()}`);
    console.log(`   APY as number: ${Number(directApy)}`);
    console.log(`   APY / 1e18: ${Number(directApy) / 1e18}`);
    console.log(`   APY %: ${(Number(directApy) / 1e18 * 100).toFixed(4)}%`);
  } catch (error) {
    console.error("   Error calling direct APY:", error.message);
  }
  
  // Test 2: Get APY through YieldAggregator
  try {
    console.log("\n2. APY through YieldAggregator:");
    const strategyIds = await yieldAggregator.getAllStrategyIds();
    console.log(`   Total strategies: ${strategyIds.length}`);
    
    for (let i = 0; i < strategyIds.length; i++) {
      const strategyInfo = await yieldAggregator.getStrategyInfo(i);
      if (strategyInfo.strategyAddress === wbtcStrategyAddress) {
        console.log(`   Found WBTC strategy at ID: ${i}`);
        console.log(`   Strategy name: ${strategyInfo.name}`);
        console.log(`   Strategy type: ${strategyInfo.strategyType}`);
        console.log(`   Token address: ${strategyInfo.tokenAddress}`);
        console.log(`   Is active: ${strategyInfo.isActive}`);
        
        // Get strategy data
        const strategyData = await yieldAggregator.getStrategyData(i);
        console.log(`   Strategy data APY: ${strategyData.apy.toString()}`);
        console.log(`   Strategy data APY as number: ${Number(strategyData.apy)}`);
        console.log(`   Strategy data APY / 1e18: ${Number(strategyData.apy) / 1e18}`);
        console.log(`   Strategy data APY %: ${(Number(strategyData.apy) / 1e18 * 100).toFixed(4)}%`);
        break;
      }
    }
  } catch (error) {
    console.error("   Error getting APY through aggregator:", error.message);
  }
  
  // Test 3: Check Aave reserve data directly
  try {
    console.log("\n3. Aave reserve data for WBTC:");
    const aaveDataProvider = addresses["11155111"].aaveV3?.core?.AAVE_PROTOCOL_DATA_PROVIDER;
    console.log(`   Aave Data Provider: ${aaveDataProvider}`);
    
    // Create a simple contract to call getReserveData
    const dataProviderAbi = [
      "function getReserveData(address asset) external view returns (tuple(uint256 availableLiquidity, uint256 totalStableDebt, uint256 totalVariableDebt, uint256 liquidityRate, uint256 variableBorrowRate, uint256 stableBorrowRate, uint256 averageStableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex, uint40 lastUpdateTimestamp))"
    ];
    
    const dataProvider = new hre.ethers.Contract(aaveDataProvider, dataProviderAbi, hre.ethers.provider);
    const reserveData = await dataProvider.getReserveData(wbtcTokenAddress);
    
    console.log(`   Liquidity Rate (RAW): ${reserveData.liquidityRate.toString()}`);
    console.log(`   Liquidity Rate as number: ${Number(reserveData.liquidityRate)}`);
    console.log(`   Liquidity Rate / 1e27: ${Number(reserveData.liquidityRate) / 1e27}`);
    console.log(`   Annualized APY: ${(Number(reserveData.liquidityRate) / 1e27 * 31536000 * 100).toFixed(4)}%`);
  } catch (error) {
    console.error("   Error getting Aave reserve data:", error.message);
  }
  
  console.log("\n=== Test Complete ===");
}

// Run the script
if (require.main === module) {
  main()
    .then(() => {
      console.log("✅ APY test completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ APY test failed:", error);
      process.exit(1);
    });
} 