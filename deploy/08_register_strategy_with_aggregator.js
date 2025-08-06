const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Configuration - Edit these variables to register different strategies
const CONFIG = {
  // Network configuration
  networkId: "11155111", // Sepolia
  networkName: "sepolia",
  
  // Strategy configuration - Change these to register different strategies
  strategyName: "CompoundWETHStrategy", // Name of the strategy contract in addresses.json
  strategyAddress: "", // Leave empty to use address from addresses.json, or specify custom address
  tokenAddress: "", // Leave empty to use WETH from Compound V3 config, or specify custom token address
  strategyType: 2, // 0 = Mock, 1 = Aave, 2 = Compound, 3 = Other
  baseRiskScore: 3, // 1-5 scale (1 = Very Low, 5 = Very High)
  isActive: true,
  
  // Strategy metadata
  strategyDescription: "Compound V3 WETH yield strategy on Sepolia testnet"
};

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Registering strategy with account: ${deployer.address}`);
  console.log(`Network: ${hre.network.name}`);
  console.log(`Strategy: ${CONFIG.strategyName}`);

  // Only register on Sepolia
  if (hre.network.config.chainId !== 11155111) {
    console.log('Skipping strategy registration - not on Sepolia');
    return;
  }

  // Load addresses.json
  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  if (!fs.existsSync(addressesPath)) {
    throw new Error('addresses.json not found');
  }

  const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
  
  // Get network configuration
  const networkConfig = addresses[CONFIG.networkId];
  if (!networkConfig) {
    throw new Error(`Network configuration not found for network ID: ${CONFIG.networkId}`);
  }

  // Get YieldAggregator address
  const yieldAggregatorAddress = networkConfig.deployedContracts?.YieldAggregator;
  if (!yieldAggregatorAddress) {
    throw new Error('YieldAggregator address not found in addresses.json');
  }

  // Get strategy address
  let strategyAddress = CONFIG.strategyAddress;
  if (!strategyAddress) {
    strategyAddress = networkConfig.deployedContracts?.[CONFIG.strategyName];
    if (!strategyAddress) {
      throw new Error(`Strategy address not found for ${CONFIG.strategyName} in addresses.json`);
    }
  }

  // Get token address
  let tokenAddress = CONFIG.tokenAddress;
  if (!tokenAddress) {
    // Default to WETH from Compound V3 config
    tokenAddress = networkConfig.compoundV3?.WETH_UNDERLYING;
    if (!tokenAddress) {
      throw new Error('Token address not found. Please specify CONFIG.tokenAddress or ensure WETH_UNDERLYING exists in Compound V3 config');
    }
  }

  console.log("\n=== Configuration ===");
  console.log(`Network: ${networkConfig.networkName}`);
  console.log(`YieldAggregator: ${yieldAggregatorAddress}`);
  console.log(`Strategy: ${CONFIG.strategyName}`);
  console.log(`Strategy Address: ${strategyAddress}`);
  console.log(`Token Address: ${tokenAddress}`);
  console.log(`Strategy Type: ${CONFIG.strategyType}`);
  console.log(`Base Risk Score: ${CONFIG.baseRiskScore}`);
  console.log(`Active: ${CONFIG.isActive}`);

  // Get YieldAggregator contract
  const YieldAggregator = await hre.ethers.getContractFactory("YieldAggregator");
  const yieldAggregator = YieldAggregator.attach(yieldAggregatorAddress);

  // Check if strategy is already registered
  console.log("\n=== Checking existing strategies ===");
  try {
    const strategyCount = await yieldAggregator.getStrategyCount();
    console.log(`Total strategies registered: ${strategyCount}`);

    // Check if this strategy is already registered
    for (let i = 0; i < strategyCount; i++) {
      const strategyInfo = await yieldAggregator.getStrategyInfo(i);
      if (strategyInfo.strategyAddress === strategyAddress) {
        console.log(`WARNING: Strategy already registered with ID: ${i}`);
        console.log(`   Strategy Address: ${strategyInfo.strategyAddress}`);
        console.log(`   Token Address: ${strategyInfo.tokenAddress}`);
        console.log(`   Active: ${strategyInfo.isActive}`);
        return;
      }
    }
  } catch (error) {
    console.log("Could not check existing strategies:", error.message);
  }

  // Register the strategy
  console.log("\n=== Registering Strategy ===");
  const tx = await yieldAggregator.registerStrategy(
    strategyAddress,
    tokenAddress,
    CONFIG.strategyType,
    CONFIG.baseRiskScore,
    CONFIG.isActive
  );

  console.log(`Transaction hash: ${tx.hash}`);
  console.log("Waiting for confirmation...");
  
  const receipt = await tx.wait();
  console.log(`✅ Strategy registered successfully!`);
  console.log(`   Block number: ${receipt.blockNumber}`);
  console.log(`   Gas used: ${receipt.gasUsed.toString()}`);

  // Get the new strategy ID
  const strategyCount = await yieldAggregator.getStrategyCount();
  const newStrategyId = strategyCount - 1n;
  
  console.log(`\n=== Registration Summary ===");
  console.log(`✅ Successfully registered ${CONFIG.strategyName}`);
  console.log(`📍 Strategy ID: ${newStrategyId}`);
  console.log(`📍 Strategy Address: ${strategyAddress}`);
  console.log(`📍 Token Address: ${tokenAddress}`);
  console.log(`🌐 Network: ${networkConfig.networkName} (${CONFIG.networkId})`);
  console.log(`📝 Description: ${CONFIG.strategyDescription}`);

  // Verify the registration
  console.log("\n=== Verification ===");
  const strategyInfo = await yieldAggregator.getStrategyInfo(newStrategyId);
  console.log(`Strategy ID ${newStrategyId} info:`);
  console.log(`  Strategy Address: ${strategyInfo.strategyAddress}`);
  console.log(`  Token Address: ${strategyInfo.tokenAddress}`);
  console.log(`  Strategy Type: ${strategyInfo.strategyType}`);
  console.log(`  Base Risk Score: ${strategyInfo.baseRiskScore}`);
  console.log(`  Active: ${strategyInfo.isActive}`);

  return {
    strategyId: newStrategyId,
    strategyAddress: strategyAddress,
    tokenAddress: tokenAddress,
    strategyType: CONFIG.strategyType,
    baseRiskScore: CONFIG.baseRiskScore,
    isActive: CONFIG.isActive
  };
}

// Helper function to list all registered strategies
async function listRegisteredStrategies() {
  const [deployer] = await hre.ethers.getSigners();
  
  // Load addresses.json
  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
  
  const networkConfig = addresses['11155111'];
  const yieldAggregatorAddress = networkConfig.deployedContracts?.YieldAggregator;
  
  if (!yieldAggregatorAddress) {
    console.log("YieldAggregator not found");
    return;
  }

  const YieldAggregator = await hre.ethers.getContractFactory("YieldAggregator");
  const yieldAggregator = YieldAggregator.attach(yieldAggregatorAddress);

  try {
    const strategyCount = await yieldAggregator.getStrategyCount();
    console.log(`\n=== Registered Strategies (${strategyCount}) ===`);
    
    for (let i = 0; i < strategyCount; i++) {
      const strategyInfo = await yieldAggregator.getStrategyInfo(i);
      console.log(`\nStrategy ID: ${i}`);
      console.log(`  Strategy Address: ${strategyInfo.strategyAddress}`);
      console.log(`  Token Address: ${strategyInfo.tokenAddress}`);
      console.log(`  Strategy Type: ${strategyInfo.strategyType}`);
      console.log(`  Base Risk Score: ${strategyInfo.baseRiskScore}`);
      console.log(`  Active: ${strategyInfo.isActive}`);
    }
  } catch (error) {
    console.log("Error listing strategies:", error.message);
  }
}

// Export for use in other scripts
module.exports = { main, listRegisteredStrategies };

// Run the script
if (require.main === module) {
  main()
    .then((result) => {
      console.log("\n🎉 Strategy registration completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Strategy registration failed:", error);
      process.exit(1);
    });
} 