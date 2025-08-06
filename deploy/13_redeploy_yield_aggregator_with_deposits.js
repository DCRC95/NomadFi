const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Redeploying YieldAggregator with fixed total deposits calculation...");

  // Load addresses.json
  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  
  // Get supported tokens for Sepolia
  const sepoliaAddresses = addresses["11155111"];
  const supportedTokens = [
    sepoliaAddresses.aaveV3.assets.LINK.UNDERLYING,
    sepoliaAddresses.aaveV3.assets.WETH.UNDERLYING,
    sepoliaAddresses.aaveV3.assets.USDC.UNDERLYING,
    sepoliaAddresses.aaveV3.assets.WBTC.UNDERLYING,
    sepoliaAddresses.aaveV3.assets.AAVE.UNDERLYING,
    sepoliaAddresses.aaveV3.assets.EURS.UNDERLYING
  ];

  console.log("Supported tokens:", supportedTokens);

  // Deploy YieldAggregator
  const YieldAggregator = await hre.ethers.getContractFactory("YieldAggregator");
  const yieldAggregator = await YieldAggregator.deploy(supportedTokens);
  await yieldAggregator.waitForDeployment();

  const aggregatorAddress = await yieldAggregator.getAddress();
  console.log("YieldAggregator deployed to:", aggregatorAddress);

  // Update addresses.json
  addresses["11155111"].yieldAggregator = aggregatorAddress;
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("Updated addresses.json with new YieldAggregator address");

  // Verify the contract
  console.log("Verifying contract...");
  try {
    await hre.run("verify:verify", {
      address: aggregatorAddress,
      constructorArguments: [supportedTokens],
    });
    console.log("Contract verified successfully");
  } catch (error) {
    console.log("Verification failed:", error.message);
  }

  console.log("✅ YieldAggregator redeployment completed!");
  console.log("New address:", aggregatorAddress);
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✅ Redeployment completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Redeployment failed:", error);
      process.exit(1);
    });
} 