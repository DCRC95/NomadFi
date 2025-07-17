// scripts/test-contract-call.js
// Test script to verify the userDeposits function call on the new YieldAggregator contract

const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Testing with account: ${deployer.address}`);
  console.log(`Network: ${hre.network.name}`);

  // New YieldAggregator address
  const YIELD_AGGREGATOR_ADDRESS = "0x22954D73CE88998Bc66334A6D28dDA5EfAc9cfDf";
  const MOCK_ERC20_ADDRESS = "0xd0B01c1ce87508757FEB41C5D8b2D117a4f4c283";
  
  // Get the contract
  const YieldAggregator = await ethers.getContractAt("YieldAggregator", YIELD_AGGREGATOR_ADDRESS);
  
  // Test getAllStrategyIds
  console.log("Testing getAllStrategyIds...");
  try {
    const strategyIds = await YieldAggregator.getAllStrategyIds();
    console.log("Strategy IDs:", strategyIds);
  } catch (error) {
    console.error("Error getting strategy IDs:", error.message);
  }
  
  // Test userDeposits for the deployer
  console.log("Testing userDeposits...");
  try {
    // Test with a sample strategy ID (first one if available)
    const strategyIds = await YieldAggregator.getAllStrategyIds();
    if (strategyIds.length > 0) {
      const firstStrategyId = strategyIds[0];
      console.log("Testing with strategy ID:", firstStrategyId);
      
      const userDeposit = await YieldAggregator.userDeposits(deployer.address, MOCK_ERC20_ADDRESS, firstStrategyId);
      console.log("User deposit amount:", userDeposit.toString());
    } else {
      console.log("No strategies found, testing with empty strategy ID");
      const userDeposit = await YieldAggregator.userDeposits(deployer.address, MOCK_ERC20_ADDRESS, "0x0000000000000000000000000000000000000000000000000000000000000000");
      console.log("User deposit amount:", userDeposit.toString());
    }
  } catch (error) {
    console.error("Error getting user deposits:", error.message);
  }
  
  // Test getStrategyInfo for first strategy
  console.log("Testing getStrategyInfo...");
  try {
    const strategyIds = await YieldAggregator.getAllStrategyIds();
    if (strategyIds.length > 0) {
      const firstStrategyId = strategyIds[0];
      const strategyInfo = await YieldAggregator.getStrategyInfo(firstStrategyId);
      console.log("Strategy info:", {
        strategyAddress: strategyInfo.strategyAddress,
        chainId: strategyInfo.chainId.toString(),
        name: strategyInfo.name,
        description: strategyInfo.description,
        baseRiskScore: strategyInfo.baseRiskScore.toString(),
        isActive: strategyInfo.isActive
      });
    }
  } catch (error) {
    console.error("Error getting strategy info:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 