const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 Debugging Sepolia Aave Strategies...");

  // Load addresses.json
  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  
  const sepoliaAddresses = addresses["11155111"];
  const aaveV3Core = sepoliaAddresses.aaveV3.core;
  
  console.log("📋 Aave V3 Configuration:");
  console.log(`- POOL_ADDRESSES_PROVIDER: ${aaveV3Core.POOL_ADDRESSES_PROVIDER}`);
  console.log(`- POOL: ${aaveV3Core.POOL}`);
  console.log(`- AAVE_PROTOCOL_DATA_PROVIDER: ${aaveV3Core.AAVE_PROTOCOL_DATA_PROVIDER}`);

  // Test each Aave strategy
  const strategyAddresses = [
    "0x3C96145eb50db60F177079e8416c634EcA5141f6", // LINK
    "0x4d4985590B82aB168FD61E6C8A21d920f30db1ad", // WBTC
    "0x6cF0703056c1043e1fBe7162FbBfca5B03a917AF", // AAVE
    "0x47DAC3Cd945790404d95c39F6c278e69f5409641"  // EURS
  ];

  for (let i = 0; i < strategyAddresses.length; i++) {
    const strategyAddress = strategyAddresses[i];
    const assetNames = ["LINK", "WBTC", "AAVE", "EURS"];
    const assetName = assetNames[i];
    
    console.log(`\n=== Testing ${assetName} Strategy ===`);
    console.log(`Strategy Address: ${strategyAddress}`);
    
    try {
      const AAVEYieldStrategy = await hre.ethers.getContractFactory("AAVEYieldStrategy");
      const strategy = AAVEYieldStrategy.attach(strategyAddress);
      
      // Test basic contract calls
      console.log("Testing contract calls...");
      
      try {
        const aaveProvider = await strategy.AAVE_ADDRESSES_PROVIDER();
        console.log(`✓ AAVE_ADDRESSES_PROVIDER: ${aaveProvider}`);
      } catch (error) {
        console.log(`✗ AAVE_ADDRESSES_PROVIDER error: ${error.message}`);
      }
      
      try {
        const underlyingToken = await strategy.underlyingToken();
        console.log(`✓ UNDERLYING_TOKEN: ${underlyingToken}`);
      } catch (error) {
        console.log(`✗ UNDERLYING_TOKEN error: ${error.message}`);
      }
      
      try {
        const aToken = await strategy.aToken();
        console.log(`✓ A_TOKEN: ${aToken}`);
      } catch (error) {
        console.log(`✗ A_TOKEN error: ${error.message}`);
      }
      
      try {
        const currentBalance = await strategy.getCurrentBalance();
        console.log(`✓ getCurrentBalance: ${currentBalance.toString()}`);
      } catch (error) {
        console.log(`✗ getCurrentBalance error: ${error.message}`);
      }
      
      try {
        const totalSupply = await strategy.getTotalSupply();
        console.log(`✓ getTotalSupply: ${totalSupply.toString()}`);
      } catch (error) {
        console.log(`✗ getTotalSupply error: ${error.message}`);
      }
      
      try {
        const apy = await strategy.apy();
        console.log(`✓ apy: ${apy.toString()}`);
      } catch (error) {
        console.log(`✗ apy error: ${error.message}`);
      }
      
    } catch (error) {
      console.log(`✗ Failed to attach to strategy contract: ${error.message}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });