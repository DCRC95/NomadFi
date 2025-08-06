const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Testing Base Sepolia TVL and Total Deposits...");

  // Load addresses.json
  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  
  const baseSepoliaAddresses = addresses["84532"];
  const aggregatorAddress = baseSepoliaAddresses.deployedContracts.YieldAggregator;
  
  console.log("YieldAggregator address:", aggregatorAddress);

  // Get the YieldAggregator contract
  const YieldAggregator = await hre.ethers.getContractFactory("YieldAggregator");
  const aggregator = YieldAggregator.attach(aggregatorAddress);

  // Get all strategy IDs
  const strategyIds = await aggregator.getAllStrategyIds();
  console.log(`Found ${strategyIds.length} strategies`);

  for (const strategyId of strategyIds) {
    console.log(`\n=== Strategy ${strategyId} ===`);
    
    try {
      // Get strategy info
      const strategyInfo = await aggregator.getStrategyInfo(strategyId);
      console.log(`Name: ${strategyInfo.name}`);
      console.log(`Token: ${strategyInfo.tokenAddress}`);
      console.log(`Strategy: ${strategyInfo.strategyAddress}`);
      console.log(`Type: ${strategyInfo.strategyType}`);
      console.log(`Active: ${strategyInfo.isActive}`);

      // Get strategy data
      const strategyData = await aggregator.getStrategyData(strategyId);
      console.log(`APY: ${strategyData.apy.toString()}`);
      console.log(`Total Deposits: ${strategyData.totalDeposits.toString()}`);
      console.log(`Total Value Locked: ${strategyData.totalValueLocked.toString()}`);

      // Test individual functions
      const totalDeposits = await aggregator.getTotalDepositsForStrategy(strategyId);
      const totalValueLocked = await aggregator.getTotalValueLockedForStrategy(strategyId);
      console.log(`getTotalDepositsForStrategy: ${totalDeposits.toString()}`);
      console.log(`getTotalValueLockedForStrategy: ${totalValueLocked.toString()}`);

      // If it's an AAVE strategy, test the strategy contract directly
      if (strategyInfo.strategyType === 1) { // AAVE
        console.log("\nTesting AAVE strategy contract directly...");
        const AAVEYieldStrategy = await hre.ethers.getContractFactory("AAVEYieldStrategy");
        const strategy = AAVEYieldStrategy.attach(strategyInfo.strategyAddress);
        
        try {
          const currentBalance = await strategy.getCurrentBalance();
          const totalSupply = await strategy.getTotalSupply();
          const apy = await strategy.apy();
          
          console.log(`Strategy getCurrentBalance: ${currentBalance.toString()}`);
          console.log(`Strategy getTotalSupply: ${totalSupply.toString()}`);
          console.log(`Strategy apy: ${apy.toString()}`);
        } catch (error) {
          console.log(`Error calling strategy contract: ${error.message}`);
        }
      }

    } catch (error) {
      console.error(`Error with strategy ${strategyId}:`, error.message);
    }
  }

  console.log("\n=== Test Complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });