// deploy/12_add_wbtc_supported_token.js
// Add WBTC as a supported token in the YieldAggregator

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Adding WBTC as supported token with account: ${deployer.address}`);
  console.log(`Network: ${hre.network.name}`);

  // Load addresses.json
  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  
  // Get network configuration for Sepolia
  const networkConfig = addresses["11155111"];
  if (!networkConfig) {
    throw new Error(`Network configuration not found for Sepolia`);
  }
  
  // Get YieldAggregator address
  const yieldAggregatorAddress = networkConfig.deployedContracts?.YieldAggregator;
  if (!yieldAggregatorAddress) {
    throw new Error('YieldAggregator address not found in addresses.json');
  }
  
  // Get WBTC token address
  const wbtcTokenAddress = networkConfig.aaveV3?.assets?.WBTC?.UNDERLYING;
  if (!wbtcTokenAddress) {
    throw new Error('WBTC token address not found in addresses.json');
  }
  
  console.log("\n=== Configuration ===");
  console.log(`YieldAggregator: ${yieldAggregatorAddress}`);
  console.log(`WBTC Token: ${wbtcTokenAddress}`);
  
  // Get YieldAggregator contract
  const YieldAggregator = await hre.ethers.getContractFactory("YieldAggregator");
  const yieldAggregator = YieldAggregator.attach(yieldAggregatorAddress);
  
  // Check if WBTC is already supported
  console.log("\n=== Checking current status ===");
  try {
    const isSupported = await yieldAggregator.isSupportedToken(wbtcTokenAddress);
    console.log(`WBTC currently supported: ${isSupported}`);
    
    if (isSupported) {
      console.log("✅ WBTC is already supported. No action needed.");
      return;
    }
  } catch (error) {
    console.log("Could not check current status:", error.message);
  }
  
  // Add WBTC as supported token
  console.log("\n=== Adding WBTC as supported token ===");
  const tx = await yieldAggregator.addSupportedToken(wbtcTokenAddress);
  
  console.log(`Transaction hash: ${tx.hash}`);
  console.log("Waiting for confirmation...");
  
  const receipt = await tx.wait();
  console.log(`✅ WBTC added as supported token successfully!`);
  console.log(`   Block number: ${receipt.blockNumber}`);
  console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
  
  // Verify the addition
  console.log("\n=== Verification ===");
  const isNowSupported = await yieldAggregator.isSupportedToken(wbtcTokenAddress);
  console.log(`WBTC now supported: ${isNowSupported}`);
  
  if (isNowSupported) {
    console.log("✅ WBTC successfully added as supported token!");
  } else {
    console.log("❌ WBTC was not added as supported token.");
  }
  
  return {
    wbtcTokenAddress: wbtcTokenAddress,
    yieldAggregatorAddress: yieldAggregatorAddress,
    isSupported: isNowSupported
  };
}

// Export for use in other scripts
module.exports = { main };

// Run the script
if (require.main === module) {
  main()
    .then((result) => {
      console.log("\n🎉 WBTC token addition completed successfully!");
      console.log(`🔗 WBTC Token: ${result.wbtcTokenAddress}`);
      console.log(`📊 Supported: ${result.isSupported}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ WBTC token addition failed:", error);
      process.exit(1);
    });
} 