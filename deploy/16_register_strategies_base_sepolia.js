const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Registering Base Sepolia strategies with YieldAggregator...");

  // Load addresses.json
  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  
  const baseSepoliaAddresses = addresses["84532"];
  const aggregatorAddress = "0x6e34daC43b3EAb4A2C264680052Bd27d6BbC303F";
  
  console.log("YieldAggregator address:", aggregatorAddress);

  // Get the YieldAggregator contract
  const YieldAggregator = await hre.ethers.getContractFactory("YieldAggregator");
  const aggregator = YieldAggregator.attach(aggregatorAddress);

  // Strategy registration data for Base Sepolia
  const strategies = [
    {
      id: 20,
      name: "AaveV3USDCStrategy",
      tokenAddress: baseSepoliaAddresses.aaveV3.assets.USDC.UNDERLYING,
      strategyAddress: "0x133C8914df7d0cA282c9842056f6602B1eC975FA",
      chainId: 84532,
      strategyType: 1 // Aave
    },
    {
      id: 21,
      name: "AaveV3USDTStrategy",
      tokenAddress: baseSepoliaAddresses.aaveV3.assets.USDT.UNDERLYING,
      strategyAddress: "0x20091408F7852d8B141569A50D70DF4b4eAe199a",
      chainId: 84532,
      strategyType: 1 // Aave
    },
    {
      id: 22,
      name: "AaveV3WBTCStrategy",
      tokenAddress: baseSepoliaAddresses.aaveV3.assets.WBTC.UNDERLYING,
      strategyAddress: "0x7EC25F4bCd92850D9CaE11695782AF688d70d736",
      chainId: 84532,
      strategyType: 1 // Aave
    },
    {
      id: 23,
      name: "AaveV3WETHStrategy",
      tokenAddress: baseSepoliaAddresses.aaveV3.assets.WETH.UNDERLYING,
      strategyAddress: "0xf9A0E2892CCC206149DEDf50E6fFf6BFc1BfB2f0",
      chainId: 84532,
      strategyType: 1 // Aave
    },
    {
      id: 24,
      name: "AaveV3cbETHStrategy",
      tokenAddress: baseSepoliaAddresses.aaveV3.assets.cbETH.UNDERLYING,
      strategyAddress: "0x6dC54Cb7591507f1e5125CC5758D8796e7BdB364",
      chainId: 84532,
      strategyType: 1 // Aave
    },
    {
      id: 25,
      name: "AaveV3LINKStrategy",
      tokenAddress: baseSepoliaAddresses.aaveV3.assets.LINK.UNDERLYING,
      strategyAddress: "0xBfe85Faa4eA50E405B60904553753d0bf0D99212",
      chainId: 84532,
      strategyType: 1 // Aave
    }
  ];

  console.log(`Registering ${strategies.length} strategies with IDs 20-25`);

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

  console.log("\n✅ Base Sepolia strategy registration completed!");
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✅ Base Sepolia registration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Base Sepolia registration failed:", error);
      process.exit(1);
    });
} 