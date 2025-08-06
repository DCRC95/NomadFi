// deploy/11_deploy_wbtc_aave_strategy.js
// Deploy WBTC Aave yield strategy and register with YieldAggregator

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Configuration for WBTC Aave strategy
const CONFIG = {
  // Network configuration
  networkId: "11155111", // Sepolia
  networkName: "sepolia",
  
  // Asset configuration
  assetName: "WBTC", // WBTC asset
  
  // Strategy configuration
  strategyName: "AaveV3WBTCStrategy", // This will be the deployed contract name
  strategyDescription: "Aave V3 WBTC yield strategy on Sepolia testnet"
};

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying WBTC Aave strategy with account: ${deployer.address}`);
  console.log(`Network: ${hre.network.name}`);
  console.log(`Target Network ID: ${CONFIG.networkId}`);
  console.log(`Asset: ${CONFIG.assetName}`);

  // Load addresses.json
  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  
  // Get network configuration
  const networkConfig = addresses[CONFIG.networkId];
  if (!networkConfig) {
    throw new Error(`Network configuration not found for network ID: ${CONFIG.networkId}`);
  }
  
  // Get Aave V3 core addresses
  const aaveV3Core = networkConfig.aaveV3?.core;
  if (!aaveV3Core) {
    throw new Error(`Aave V3 core configuration not found for network: ${CONFIG.networkId}`);
  }
  
  // Get WBTC asset configuration
  const assetConfig = networkConfig.aaveV3?.assets?.[CONFIG.assetName];
  if (!assetConfig) {
    throw new Error(`WBTC asset configuration not found on network: ${CONFIG.networkId}`);
  }
  
  // Extract addresses
  const AAVE_V3_ADDRESSES_PROVIDER = aaveV3Core.POOL_ADDRESSES_PROVIDER;
  const UNDERLYING_TOKEN = assetConfig.UNDERLYING;
  const A_TOKEN = assetConfig.A_TOKEN;
  
  console.log("\n=== WBTC Configuration ===");
  console.log(`Network: ${networkConfig.networkName}`);
  console.log(`Asset: ${CONFIG.assetName}`);
  console.log(`AAVE_V3_ADDRESSES_PROVIDER: ${AAVE_V3_ADDRESSES_PROVIDER}`);
  console.log(`UNDERLYING_TOKEN (WBTC): ${UNDERLYING_TOKEN}`);
  console.log(`A_TOKEN (aWBTC): ${A_TOKEN}`);
  console.log(`Decimals: ${assetConfig.DECIMALS}`);
  
  // Validate addresses
  if (!AAVE_V3_ADDRESSES_PROVIDER || !UNDERLYING_TOKEN || !A_TOKEN) {
    throw new Error("Missing required addresses in configuration");
  }
  
  // --- DEPLOY AAVEYieldStrategy for WBTC ---
  console.log("\n=== Deploying AAVEYieldStrategy for WBTC ===");
  const AAVEYieldStrategy = await hre.ethers.getContractFactory("AAVEYieldStrategy");
  const aaveYieldStrategy = await AAVEYieldStrategy.deploy(
    AAVE_V3_ADDRESSES_PROVIDER,
    UNDERLYING_TOKEN,
    A_TOKEN
  );
  await aaveYieldStrategy.waitForDeployment();
  
  console.log(`✅ AAVEYieldStrategy for WBTC deployed at: ${aaveYieldStrategy.target}`);
  console.log("\n=== Constructor Arguments ===");
  console.log(`AAVE_V3_ADDRESSES_PROVIDER: ${AAVE_V3_ADDRESSES_PROVIDER}`);
  console.log(`UNDERLYING_TOKEN (WBTC): ${UNDERLYING_TOKEN}`);
  console.log(`A_TOKEN (aWBTC): ${A_TOKEN}`);
  
  // --- UPDATE addresses.json ---
  console.log("\n=== Updating addresses.json ===");
  if (!networkConfig.deployedContracts) {
    networkConfig.deployedContracts = {};
  }
  
  // Add the new WBTC strategy to deployedContracts
  networkConfig.deployedContracts[CONFIG.strategyName] = aaveYieldStrategy.target;
  
  // Write back to addresses.json
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log(`✅ Updated addresses.json with ${CONFIG.strategyName}: ${aaveYieldStrategy.target}`);
  
  // --- REGISTER WITH YIELD AGGREGATOR ---
  console.log("\n=== Registering WBTC Strategy with YieldAggregator ===");
  
  // Get YieldAggregator address
  const yieldAggregatorAddress = networkConfig.deployedContracts?.YieldAggregator;
  if (!yieldAggregatorAddress) {
    throw new Error('YieldAggregator address not found in addresses.json');
  }
  
  // Get YieldAggregator contract
  const YieldAggregator = await hre.ethers.getContractFactory("YieldAggregator");
  const yieldAggregator = YieldAggregator.attach(yieldAggregatorAddress);
  
  // Check if strategy is already registered
  console.log("Checking existing strategies...");
  let strategyCount = 0;
  try {
    const strategyIds = await yieldAggregator.getAllStrategyIds();
    strategyCount = strategyIds.length;
    console.log(`Total strategies registered: ${strategyCount}`);

    // Check if this strategy is already registered
    for (let i = 0; i < strategyCount; i++) {
      const strategyInfo = await yieldAggregator.getStrategyInfo(i);
      if (strategyInfo.strategyAddress === aaveYieldStrategy.target) {
        console.log(`WARNING: WBTC strategy already registered with ID: ${i}`);
        console.log(`   Strategy Address: ${strategyInfo.strategyAddress}`);
        console.log(`   Token Address: ${strategyInfo.tokenAddress}`);
        console.log(`   Active: ${strategyInfo.isActive}`);
        return;
      }
    }
  } catch (error) {
    console.log("Could not check existing strategies:", error.message);
  }
  
  // Register the WBTC strategy
  console.log("Registering WBTC strategy...");
  const tx = await yieldAggregator.addStrategy(
    strategyCount, // Use next available ID
    UNDERLYING_TOKEN, // WBTC token address
    aaveYieldStrategy.target, // Strategy contract address
    CONFIG.strategyName, // Strategy name
    parseInt(CONFIG.networkId), // Chain ID
    1 // StrategyType.Aave = 1
  );

  console.log(`Transaction hash: ${tx.hash}`);
  console.log("Waiting for confirmation...");
  
  const receipt = await tx.wait();
  console.log(`✅ WBTC strategy registered successfully!`);
  console.log(`   Block number: ${receipt.blockNumber}`);
  console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
  
  // Get the new strategy ID
  const newStrategyIds = await yieldAggregator.getAllStrategyIds();
  const newStrategyId = newStrategyIds.length - 1;
  
  // --- VERIFICATION INFO ---
  console.log("\n=== Verification Info ===");
  console.log("To verify on Etherscan, use these constructor arguments:");
  console.log(`[${AAVE_V3_ADDRESSES_PROVIDER}, ${UNDERLYING_TOKEN}, ${A_TOKEN}]`);
  
  // --- SUMMARY ---
  console.log("\n=== Deployment Summary ===");
  console.log(`✅ Successfully deployed and registered ${CONFIG.strategyName}`);
  console.log(`📍 Strategy Contract Address: ${aaveYieldStrategy.target}`);
  console.log(`📍 Strategy ID in Aggregator: ${newStrategyId}`);
  console.log(`📍 WBTC Token Address: ${UNDERLYING_TOKEN}`);
  console.log(`📍 aWBTC Token Address: ${A_TOKEN}`);
  console.log(`🌐 Network: ${networkConfig.networkName} (${CONFIG.networkId})`);
  console.log(`💰 Asset: ${CONFIG.assetName} (${assetConfig.DECIMALS} decimals)`);
  console.log(`📝 Description: ${CONFIG.strategyDescription}`);
  
  return {
    strategyAddress: aaveYieldStrategy.target,
    strategyId: newStrategyId,
    networkId: CONFIG.networkId,
    assetName: CONFIG.assetName,
    underlyingToken: UNDERLYING_TOKEN,
    aToken: A_TOKEN,
    addressesProvider: AAVE_V3_ADDRESSES_PROVIDER
  };
}

// Export for use in other scripts
module.exports = { main };

// Run the script
if (require.main === module) {
  main()
    .then((result) => {
      console.log("\n🎉 WBTC Aave strategy deployment completed successfully!");
      console.log(`📊 Strategy ID: ${result.strategyId}`);
      console.log(`🔗 Strategy Address: ${result.strategyAddress}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ WBTC Aave strategy deployment failed:", error);
      process.exit(1);
    });
} 