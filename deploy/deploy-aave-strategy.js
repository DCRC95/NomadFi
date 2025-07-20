// deploy/deploy-aave-strategy.js
// Helper script to easily deploy AAVE strategies for different assets
// Usage: npx hardhat run deploy/deploy-aave-strategy.js --network sepolia --asset LINK

const { main, listAvailableAssets } = require("./02_deploy_AAVEYieldStrategy.js");

// Parse command line arguments
const args = process.argv.slice(2);
const assetIndex = args.indexOf("--asset");
const networkIndex = args.indexOf("--network");
const listAssetsIndex = args.indexOf("--list-assets");

// Check if user wants to list available assets
if (listAssetsIndex !== -1) {
  listAvailableAssets();
  process.exit(0);
}

// Get asset from command line arguments
let targetAsset = "LINK"; // default
if (assetIndex !== -1 && args[assetIndex + 1]) {
  targetAsset = args[assetIndex + 1].toUpperCase();
}

// Get network from command line arguments
let targetNetwork = "11155111"; // default to Sepolia
if (networkIndex !== -1 && args[networkIndex + 1]) {
  const networkName = args[networkIndex + 1].toLowerCase();
  switch (networkName) {
    case "sepolia":
      targetNetwork = "11155111";
      break;
    case "mainnet":
      targetNetwork = "1";
      break;
    case "polygon":
      targetNetwork = "137";
      break;
    case "arbitrum":
      targetNetwork = "42161";
      break;
    case "optimism":
      targetNetwork = "10";
      break;
    default:
      console.log(`Unknown network: ${networkName}. Using Sepolia as default.`);
      targetNetwork = "11155111";
  }
}

// Update the CONFIG object in the main script
const originalMain = main;
const customMain = async () => {
  // Dynamically update the CONFIG
  const CONFIG = {
    networkId: targetNetwork,
    networkName: targetNetwork === "11155111" ? "sepolia" : `network-${targetNetwork}`,
    assetName: targetAsset,
    strategyName: `AaveV3${targetAsset}Strategy`,
    strategyDescription: `Aave V3 ${targetAsset} yield strategy`
  };
  
  console.log("🚀 Deploying AAVE Strategy");
  console.log("================================");
  console.log(`Asset: ${CONFIG.assetName}`);
  console.log(`Network: ${CONFIG.networkName} (${CONFIG.networkId})`);
  console.log(`Strategy: ${CONFIG.strategyName}`);
  console.log("================================");
  
  // Call the original main function with updated config
  return await originalMain();
};

// Run the deployment
customMain()
  .then((result) => {
    console.log("\n🎉 Deployment completed successfully!");
    console.log(`📋 Strategy deployed: ${result.strategyAddress}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 