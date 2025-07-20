// deploy/list-aave-assets.js
// Script to list all available AAVE assets from addresses.json

const fs = require("fs");
const path = require("path");

function listAvailableAssets() {
  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  
  console.log("\n=== Available AAVE Assets ===");
  Object.keys(addresses).forEach(networkId => {
    const networkConfig = addresses[networkId];
    const assets = networkConfig.aaveV3?.assets;
    if (assets) {
      console.log(`\n🌐 Network: ${networkConfig.networkName} (${networkId})`);
      Object.keys(assets).forEach(assetName => {
        const asset = assets[assetName];
        console.log(`  💰 ${assetName}:`);
        console.log(`     Underlying: ${asset.UNDERLYING}`);
        console.log(`     A-Token:    ${asset.A_TOKEN}`);
        console.log(`     Decimals:   ${asset.DECIMALS}`);
        console.log(`     Oracle:     ${asset.ORACLE}`);
      });
    }
  });
  
  console.log("\n=== Usage Examples ===");
  console.log("To deploy a strategy for any asset:");
  console.log("npx hardhat run deploy/deploy-aave-strategy.js --network sepolia --asset LINK");
  console.log("npx hardhat run deploy/deploy-aave-strategy.js --network sepolia --asset USDC");
  console.log("npx hardhat run deploy/deploy-aave-strategy.js --network sepolia --asset WETH");
}

listAvailableAssets(); 