const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Redeploying Aave Strategies on Sepolia");
  console.log("==========================================");

  // Load addresses.json
  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  
  const sepoliaAddresses = addresses["11155111"];
  const aaveV3Assets = sepoliaAddresses.aaveV3.assets;

  // Define strategies to deploy
  const strategies = [
    { name: "LINK", asset: "LINK" },
    { name: "WETH", asset: "WETH" },
    { name: "USDC", asset: "USDC" },
    { name: "WBTC", asset: "WBTC" },
    { name: "AAVE", asset: "AAVE" },
    { name: "EURS", asset: "EURS" }
  ];

  console.log("📋 Deploying strategies with latest contract version...");
  console.log("(Includes getTotalSupply() function for proper TVL calculation)");

  const deployedStrategies = [];

  for (const strategy of strategies) {
    console.log(`\n📦 Deploying ${strategy.name} strategy...`);
    
    const assetConfig = aaveV3Assets[strategy.asset];
    const AAVE_V3_ADDRESSES_PROVIDER = sepoliaAddresses.aaveV3.core.POOL_ADDRESSES_PROVIDER;
    const UNDERLYING_TOKEN = assetConfig.UNDERLYING;
    const A_TOKEN = assetConfig.A_TOKEN;

    console.log(`- UNDERLYING_TOKEN: ${UNDERLYING_TOKEN}`);
    console.log(`- A_TOKEN: ${A_TOKEN}`);
    console.log(`- AAVE_ADDRESSES_PROVIDER: ${AAVE_V3_ADDRESSES_PROVIDER}`);

    try {
      const AAVEYieldStrategy = await hre.ethers.getContractFactory("AAVEYieldStrategy");
      const aaveYieldStrategy = await AAVEYieldStrategy.deploy(
        AAVE_V3_ADDRESSES_PROVIDER,
        UNDERLYING_TOKEN,
        A_TOKEN
      );
      await aaveYieldStrategy.waitForDeployment();

      const strategyAddress = await aaveYieldStrategy.getAddress();
      console.log(`✅ ${strategy.name} strategy deployed to: ${strategyAddress}`);

      deployedStrategies.push({
        name: strategy.name,
        address: strategyAddress,
        underlyingToken: UNDERLYING_TOKEN,
        aToken: A_TOKEN,
        aaveAddressesProvider: AAVE_V3_ADDRESSES_PROVIDER
      });

    } catch (error) {
      console.error(`❌ Failed to deploy ${strategy.name} strategy:`, error.message);
    }
  }

  // Update addresses.json
  console.log("\n�� Updating addresses.json...");
  
  // Add deployedContracts section if it doesn't exist
  if (!addresses["11155111"].deployedContracts) {
    addresses["11155111"].deployedContracts = {};
  }
  
  // Add strategy addresses
  for (const strategy of deployedStrategies) {
    addresses["11155111"].deployedContracts[`AaveV3${strategy.name}Strategy`] = strategy.address;
  }
  
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("✅ Updated addresses.json");

  // Verification
  console.log("\n🔍 Verifying contracts...");
  
  for (const strategy of deployedStrategies) {
    try {
      await hre.run("verify:verify", {
        address: strategy.address,
        constructorArguments: [
          strategy.aaveAddressesProvider,
          strategy.underlyingToken,
          strategy.aToken
        ],
      });
      console.log(`✅ ${strategy.name} strategy verified successfully`);
    } catch (error) {
      console.log(`⚠️ ${strategy.name} strategy verification failed:`, error.message);
    }
  }

  // Summary
  console.log("\n🎉 Strategy Redeployment Complete!");
  console.log("==================================");
  console.log("Deployed strategies:");
  for (const strategy of deployedStrategies) {
    console.log(`- ${strategy.name}: ${strategy.address}`);
  }
  
  console.log("\n📋 Next steps:");
  console.log("1. Register strategies with YieldAggregator:");
  console.log("   npx hardhat run scripts/register-sepolia-strategies.js --network sepolia");
  console.log("2. Test TVL calculation:");
  console.log("   npx hardhat run scripts/test-sepolia-tvl.js --network sepolia");
  console.log("3. Check frontend to see if TVL is now working correctly");
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✅ Strategy redeployment successful!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Redeployment failed:", error);
      process.exit(1);
    });
}