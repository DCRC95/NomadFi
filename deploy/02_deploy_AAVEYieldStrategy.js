// deploy/02_deploy_AAVEYieldStrategy.js
// Flexible deployment script for AAVE yield strategies
// Can deploy to any Aave-related pool using addresses.json configuration

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Configuration - Edit these variables to deploy different strategies
const CONFIG = {
  // Network configuration
  networkId: "11155111", // Sepolia
  networkName: "sepolia",
  
  // Asset configuration - Change this to deploy for different assets
  assetName: "LINK", // Options: "LINK", "USDC", "DAI", "WETH", "WBTC", "USDT", "AAVE", "EURS", "GHO"
  
  // Strategy configuration
  strategyName: "AaveV3LINKStrategy", // This will be the deployed contract name
  strategyDescription: "Aave V3 LINK yield strategy on Sepolia testnet"
};

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);
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
  
  // Get asset configuration
  const assetConfig = networkConfig.aaveV3?.assets?.[CONFIG.assetName];
  if (!assetConfig) {
    throw new Error(`Asset configuration not found for ${CONFIG.assetName} on network: ${CONFIG.networkId}`);
  }
  
  // Extract addresses
  const AAVE_V3_ADDRESSES_PROVIDER = aaveV3Core.POOL_ADDRESSES_PROVIDER;
  const UNDERLYING_TOKEN = assetConfig.UNDERLYING;
  const A_TOKEN = assetConfig.A_TOKEN;
  
  console.log("\n=== Configuration ===");
  console.log(`Network: ${networkConfig.networkName}`);
  console.log(`Asset: ${CONFIG.assetName}`);
  console.log(`AAVE_V3_ADDRESSES_PROVIDER: ${AAVE_V3_ADDRESSES_PROVIDER}`);
  console.log(`UNDERLYING_TOKEN (${CONFIG.assetName}): ${UNDERLYING_TOKEN}`);
  console.log(`A_TOKEN (a${CONFIG.assetName}): ${A_TOKEN}`);
  console.log(`Decimals: ${assetConfig.DECIMALS}`);
  
  // Validate addresses
  if (!AAVE_V3_ADDRESSES_PROVIDER || !UNDERLYING_TOKEN || !A_TOKEN) {
    throw new Error("Missing required addresses in configuration");
  }
  
  // --- DEPLOY AAVEYieldStrategy ---
  console.log("\n=== Deploying AAVEYieldStrategy ===");
  const AAVEYieldStrategy = await hre.ethers.getContractFactory("AAVEYieldStrategy");
  const aaveYieldStrategy = await AAVEYieldStrategy.deploy(
    AAVE_V3_ADDRESSES_PROVIDER,
    UNDERLYING_TOKEN,
    A_TOKEN
  );
  await aaveYieldStrategy.waitForDeployment();
  
  console.log(`✅ AAVEYieldStrategy deployed at: ${aaveYieldStrategy.target}`);
  console.log("\n=== Constructor Arguments ===");
  console.log(`AAVE_V3_ADDRESSES_PROVIDER: ${AAVE_V3_ADDRESSES_PROVIDER}`);
  console.log(`UNDERLYING_TOKEN: ${UNDERLYING_TOKEN}`);
  console.log(`A_TOKEN: ${A_TOKEN}`);
  
  // --- UPDATE addresses.json ---
  console.log("\n=== Updating addresses.json ===");
  if (!networkConfig.deployedContracts) {
    networkConfig.deployedContracts = {};
  }
  
  // Add the new strategy to deployedContracts
  networkConfig.deployedContracts[CONFIG.strategyName] = aaveYieldStrategy.target;
  
  // Write back to addresses.json
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log(`✅ Updated addresses.json with ${CONFIG.strategyName}: ${aaveYieldStrategy.target}`);
  
  // --- VERIFICATION INFO ---
  console.log("\n=== Verification Info ===");
  console.log("To verify on Etherscan, use these constructor arguments:");
  console.log(`[${AAVE_V3_ADDRESSES_PROVIDER}, ${UNDERLYING_TOKEN}, ${A_TOKEN}]`);
  
  // --- SUMMARY ---
  console.log("\n=== Deployment Summary ===");
  console.log(`✅ Successfully deployed ${CONFIG.strategyName} for ${CONFIG.assetName}`);
  console.log(`📍 Contract Address: ${aaveYieldStrategy.target}`);
  console.log(`🌐 Network: ${networkConfig.networkName} (${CONFIG.networkId})`);
  console.log(`💰 Asset: ${CONFIG.assetName}`);
  console.log(`📝 Description: ${CONFIG.strategyDescription}`);
  
  return {
    strategyAddress: aaveYieldStrategy.target,
    networkId: CONFIG.networkId,
    assetName: CONFIG.assetName,
    underlyingToken: UNDERLYING_TOKEN,
    aToken: A_TOKEN,
    addressesProvider: AAVE_V3_ADDRESSES_PROVIDER
  };
}

// Helper function to list available assets
function listAvailableAssets() {
  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  
  console.log("\n=== Available Assets ===");
  Object.keys(addresses).forEach(networkId => {
    const networkConfig = addresses[networkId];
    const assets = networkConfig.aaveV3?.assets;
    if (assets) {
      console.log(`\nNetwork: ${networkConfig.networkName} (${networkId})`);
      Object.keys(assets).forEach(assetName => {
        const asset = assets[assetName];
        console.log(`  - ${assetName}: ${asset.UNDERLYING} (${asset.DECIMALS} decimals)`);
      });
    }
  });
}

// Export for use in other scripts
module.exports = { main, listAvailableAssets };

// Run the script
if (require.main === module) {
  main()
    .then((result) => {
      console.log("\n🎉 Deployment completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
} 