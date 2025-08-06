const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("�� Deploying YieldAggregator for Sepolia");
  console.log("=========================================");

  // Load addresses.json
  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  
  const sepoliaAddresses = addresses["11155111"];
  const aaveV3Assets = sepoliaAddresses.aaveV3.assets;

  // Get supported tokens from Aave V3 assets
  const supportedTokens = [
    aaveV3Assets.LINK.UNDERLYING,
    aaveV3Assets.WETH.UNDERLYING,
    aaveV3Assets.USDC.UNDERLYING,
    aaveV3Assets.WBTC.UNDERLYING,
    aaveV3Assets.AAVE.UNDERLYING,
    aaveV3Assets.EURS.UNDERLYING
  ];

  console.log("Supported tokens:", supportedTokens);

  // Deploy YieldAggregator
  console.log("\n�� Deploying YieldAggregator...");
  
  const YieldAggregator = await hre.ethers.getContractFactory("YieldAggregator");
  const yieldAggregator = await YieldAggregator.deploy(supportedTokens);
  await yieldAggregator.waitForDeployment();

  const aggregatorAddress = await yieldAggregator.getAddress();
  console.log("✅ YieldAggregator deployed to:", aggregatorAddress);

  // Update addresses.json
  console.log("\n�� Updating addresses.json...");
  
  // Add deployedContracts section if it doesn't exist
  if (!addresses["11155111"].deployedContracts) {
    addresses["11155111"].deployedContracts = {};
  }
  
  // Update YieldAggregator address
  addresses["11155111"].yieldAggregator = aggregatorAddress;
  addresses["11155111"].deployedContracts.YieldAggregator = aggregatorAddress;
  
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("✅ Updated addresses.json");

  // Verification
  console.log("\n�� Verifying contract...");
  
  try {
    await hre.run("verify:verify", {
      address: aggregatorAddress,
      constructorArguments: [supportedTokens],
    });
    console.log("✅ YieldAggregator verified successfully");
  } catch (error) {
    console.log("⚠️ YieldAggregator verification failed:", error.message);
  }

  // Summary
  console.log("\n🎉 Deployment Complete!");
  console.log("=======================");
  console.log(`YieldAggregator: ${aggregatorAddress}`);
  console.log("Supported tokens:");
  for (const token of supportedTokens) {
    console.log(`- ${token}`);
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✅ YieldAggregator deployment successful!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Deployment failed:", error);
      process.exit(1);
    });
}