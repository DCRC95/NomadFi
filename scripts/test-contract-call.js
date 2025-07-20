// scripts/test-contract-call.js
// Test script to verify the userDeposits function call on the new YieldAggregator contract

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Testing YieldAggregator contract on Sepolia...");

  // Load addresses.json
  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
  const networkConfig = addresses['11155111'];
  
  const yieldAggregatorAddress = networkConfig.deployedContracts?.YieldAggregator;
  console.log(`YieldAggregator address: ${yieldAggregatorAddress}`);

  if (!yieldAggregatorAddress) {
    console.log("❌ No YieldAggregator address found in addresses.json");
    return;
  }

  try {
    // Get provider
    const provider = new hre.ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    
    // Check if contract exists by getting its code
    const code = await provider.getCode(yieldAggregatorAddress);
    console.log(`Contract code length: ${code.length}`);
    
    if (code === "0x") {
      console.log("❌ No contract deployed at this address");
      return;
    }

    console.log("✅ Contract exists at this address");

    // Try to get contract instance
    const YieldAggregator = await hre.ethers.getContractFactory("YieldAggregator");
    const yieldAggregator = YieldAggregator.attach(yieldAggregatorAddress);

    // Test basic functions
    console.log("\n--- Testing Basic Functions ---");
    
    try {
      const owner = await yieldAggregator.owner();
      console.log(`✅ Owner: ${owner}`);
    } catch (error) {
      console.log(`❌ Owner call failed: ${error.message}`);
    }

    try {
      const strategyIds = await yieldAggregator.getAllStrategyIds();
      console.log(`✅ getAllStrategyIds: ${strategyIds.length} strategies found`);
      console.log(`   Strategy IDs: ${strategyIds.map(id => id.toString())}`);
    } catch (error) {
      console.log(`❌ getAllStrategyIds failed: ${error.message}`);
    }

    try {
      const strategyCount = await yieldAggregator.strategyIds.length;
      console.log(`✅ strategyIds.length: ${strategyCount}`);
    } catch (error) {
      console.log(`❌ strategyIds.length failed: ${error.message}`);
    }

    // Test if we can get strategy info for ID 0
    try {
      const strategyInfo = await yieldAggregator.getStrategyInfo(0);
      console.log(`✅ getStrategyInfo(0): ${strategyInfo.name}`);
    } catch (error) {
      console.log(`❌ getStrategyInfo(0) failed: ${error.message}`);
    }

    // Test batch function
    try {
      const batchData = await yieldAggregator.getBatchStrategyData([0]);
      console.log(`✅ getBatchStrategyData([0]): ${batchData.length} items returned`);
    } catch (error) {
      console.log(`❌ getBatchStrategyData([0]) failed: ${error.message}`);
    }

  } catch (error) {
    console.error("❌ Error testing contract:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 