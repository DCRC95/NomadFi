// scripts/add-sepolia-token.js
// Add Sepolia MockERC20 token to Amoy YieldAggregator's supported tokens

const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Adding Sepolia token with account: ${deployer.address}`);
  console.log(`Network: ${hre.network.name}`);

  // Contract addresses
  const YIELD_AGGREGATOR_ADDRESS = "0x22954D73CE88998Bc66334A6D28dDA5EfAc9cfDf";
  const SEPOLIA_MOCK_ERC20_ADDRESS = "0x8b80b737c954d5fB43B390C083d72E210248ec64";
  
  // Get YieldAggregator contract
  const YieldAggregator = await ethers.getContractAt("YieldAggregator", YIELD_AGGREGATOR_ADDRESS);
  
  // Check if token is already supported
  const isSupported = await YieldAggregator.isSupportedToken(SEPOLIA_MOCK_ERC20_ADDRESS);
  console.log(`Sepolia MockERC20 is currently supported: ${isSupported}`);
  
  if (!isSupported) {
    console.log("Adding Sepolia MockERC20 to supported tokens...");
    try {
      const tx = await YieldAggregator.addSupportedToken(SEPOLIA_MOCK_ERC20_ADDRESS);
      await tx.wait();
      console.log("✅ Sepolia MockERC20 added to supported tokens!");
      
      // Verify it was added
      const isNowSupported = await YieldAggregator.isSupportedToken(SEPOLIA_MOCK_ERC20_ADDRESS);
      console.log(`Sepolia MockERC20 is now supported: ${isNowSupported}`);
    } catch (error) {
      console.error("❌ Error adding token:", error.message);
    }
  } else {
    console.log("Token is already supported!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 