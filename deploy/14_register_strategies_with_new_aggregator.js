const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Registering all strategies with the new YieldAggregator...");

  // Load addresses.json
  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  
  const sepoliaAddresses = addresses["11155111"];
  const newAggregatorAddress = sepoliaAddresses.yieldAggregator;
  
  console.log("New YieldAggregator address:", newAggregatorAddress);

  // Get the YieldAggregator contract
  const YieldAggregator = await hre.ethers.getContractFactory("YieldAggregator");
  const aggregator = YieldAggregator.attach(newAggregatorAddress);

  // Strategy registration data - only include strategies that exist
  const strategies = [];
  let strategyId = 0;

  // Check which strategies exist and add them
  if (sepoliaAddresses.deployedContracts.AaveV3LINKStrategy) {
    strategies.push({
      id: strategyId++,
      name: "AaveV3LINKStrategy",
      tokenAddress: sepoliaAddresses.aaveV3.assets.LINK.UNDERLYING,
      strategyAddress: sepoliaAddresses.deployedContracts.AaveV3LINKStrategy,
      chainId: 11155111,
      strategyType: 1 // Aave
    });
  }

  if (sepoliaAddresses.deployedContracts.AaveV3WETHStrategy) {
    strategies.push({
      id: strategyId++,
      name: "AaveV3WETHStrategy",
      tokenAddress: sepoliaAddresses.aaveV3.assets.WETH.UNDERLYING,
      strategyAddress: sepoliaAddresses.deployedContracts.AaveV3WETHStrategy,
      chainId: 11155111,
      strategyType: 1 // Aave
    });
  }

  if (sepoliaAddresses.deployedContracts.AaveV3USDCStrategy) {
    strategies.push({
      id: strategyId++,
      name: "AaveV3USDCStrategy",
      tokenAddress: sepoliaAddresses.aaveV3.assets.USDC.UNDERLYING,
      strategyAddress: sepoliaAddresses.deployedContracts.AaveV3USDCStrategy,
      chainId: 11155111,
      strategyType: 1 // Aave
    });
  }

  if (sepoliaAddresses.deployedContracts.AaveV3WBTCStrategy) {
    strategies.push({
      id: strategyId++,
      name: "AaveV3WBTCStrategy",
      tokenAddress: sepoliaAddresses.aaveV3.assets.WBTC.UNDERLYING,
      strategyAddress: sepoliaAddresses.deployedContracts.AaveV3WBTCStrategy,
      chainId: 11155111,
      strategyType: 1 // Aave
    });
  }

  if (sepoliaAddresses.deployedContracts.AaveV3AAVEStrategy) {
    strategies.push({
      id: strategyId++,
      name: "AaveV3AAVEStrategy",
      tokenAddress: sepoliaAddresses.aaveV3.assets.AAVE.UNDERLYING,
      strategyAddress: sepoliaAddresses.deployedContracts.AaveV3AAVEStrategy,
      chainId: 11155111,
      strategyType: 1 // Aave
    });
  }

  if (sepoliaAddresses.deployedContracts.AaveV3EURSStrategy) {
    strategies.push({
      id: strategyId++,
      name: "AaveV3EURSStrategy",
      tokenAddress: sepoliaAddresses.aaveV3.assets.EURS.UNDERLYING,
      strategyAddress: sepoliaAddresses.deployedContracts.AaveV3EURSStrategy,
      chainId: 11155111,
      strategyType: 1 // Aave
    });
  }

  if (sepoliaAddresses.deployedContracts.CompoundWETHStrategy) {
    strategies.push({
      id: strategyId++,
      name: "CompoundWETHStrategy",
      tokenAddress: sepoliaAddresses.compoundV3.WETH_UNDERLYING,
      strategyAddress: sepoliaAddresses.deployedContracts.CompoundWETHStrategy,
      chainId: 11155111,
      strategyType: 2 // Compound
    });
  }

  console.log(`Found ${strategies.length} strategies to register`);

  // Register each strategy
  for (const strategy of strategies) {
    try {
      console.log(`\nRegistering strategy ${strategy.id}: ${strategy.name}`);
      console.log(`Token: ${strategy.tokenAddress}`);
      console.log(`Strategy: ${strategy.strategyAddress}`);
      
      const tx = await aggregator.addStrategy(
        strategy.id,
        strategy.tokenAddress,
        strategy.strategyAddress,
        strategy.name,
        strategy.chainId,
        strategy.strategyType
      );
      
      await tx.wait();
      console.log(`✅ Strategy ${strategy.id} registered successfully`);
      
      // Add delay between transactions
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Failed to register strategy ${strategy.id}:`, error.message);
    }
  }

  // Verify all strategies are registered
  console.log("\nVerifying strategy registration...");
  try {
    const strategyIds = await aggregator.getAllStrategyIds();
    console.log(`Total strategies registered: ${strategyIds.length}`);
    
    for (const strategyId of strategyIds) {
      const strategyInfo = await aggregator.getStrategyInfo(strategyId);
      console.log(`Strategy ${strategyId}: ${strategyInfo.name} (${strategyInfo.tokenAddress})`);
    }
  } catch (error) {
    console.error("Error verifying strategies:", error.message);
  }

  // Test total deposits calculation
  console.log("\nTesting total deposits calculation...");
  for (const strategy of strategies) {
    try {
      const totalDeposits = await aggregator.getTotalDepositsForStrategy(strategy.id);
      console.log(`Strategy ${strategy.id} (${strategy.name}) total deposits: ${totalDeposits.toString()}`);
    } catch (error) {
      console.error(`Error getting deposits for strategy ${strategy.id}:`, error.message);
    }
  }

  console.log("\n✅ Strategy registration completed!");
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✅ Registration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Registration failed:", error);
      process.exit(1);
    });
} 