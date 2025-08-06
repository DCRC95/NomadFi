const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying YieldAggregator for Base Sepolia...");

  // Load addresses.json
  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  
  // Get supported tokens for Base Sepolia
  const baseSepoliaAddresses = addresses["84532"];
  const supportedTokens = [
    baseSepoliaAddresses.aaveV3.assets.USDC.UNDERLYING,
    baseSepoliaAddresses.aaveV3.assets.USDT.UNDERLYING,
    baseSepoliaAddresses.aaveV3.assets.WBTC.UNDERLYING,
    baseSepoliaAddresses.aaveV3.assets.WETH.UNDERLYING,
    baseSepoliaAddresses.aaveV3.assets.cbETH.UNDERLYING,
    baseSepoliaAddresses.aaveV3.assets.LINK.UNDERLYING
  ];

  console.log("Supported tokens:", supportedTokens);

  // Deploy YieldAggregator
  const YieldAggregator = await hre.ethers.getContractFactory("YieldAggregator");
  const yieldAggregator = await YieldAggregator.deploy(supportedTokens);
  await yieldAggregator.waitForDeployment();

  const aggregatorAddress = await yieldAggregator.getAddress();
  console.log("YieldAggregator deployed to:", aggregatorAddress);

  // Update addresses.json
  if (!addresses["84532"].deployedContracts) {
    addresses["84532"].deployedContracts = {};
  }
  addresses["84532"].deployedContracts.YieldAggregator = aggregatorAddress;
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

  console.log("✅ YieldAggregator deployment for Base Sepolia completed!");
  console.log("New address:", aggregatorAddress);
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✅ Base Sepolia deployment completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Base Sepolia deployment failed:", error);
      process.exit(1);
    });
} 