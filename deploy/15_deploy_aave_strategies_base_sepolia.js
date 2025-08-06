const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying AAVE Yield Strategies for Base Sepolia...");

  // Load addresses.json
  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  
  // Get Base Sepolia addresses
  const baseSepoliaAddresses = addresses["84532"];
  const aaveAddressesProvider = baseSepoliaAddresses.aaveV3.core.POOL_ADDRESSES_PROVIDER;
  
  // Define tokens to deploy strategies for
  const tokens = [
    {
      name: "USDC",
      underlying: baseSepoliaAddresses.aaveV3.assets.USDC.UNDERLYING,
      aToken: baseSepoliaAddresses.aaveV3.assets.USDC.A_TOKEN,
      decimals: baseSepoliaAddresses.aaveV3.assets.USDC.DECIMALS
    },
    {
      name: "USDT",
      underlying: baseSepoliaAddresses.aaveV3.assets.USDT.UNDERLYING,
      aToken: baseSepoliaAddresses.aaveV3.assets.USDT.A_TOKEN,
      decimals: baseSepoliaAddresses.aaveV3.assets.USDT.DECIMALS
    },
    {
      name: "WBTC",
      underlying: baseSepoliaAddresses.aaveV3.assets.WBTC.UNDERLYING,
      aToken: baseSepoliaAddresses.aaveV3.assets.WBTC.A_TOKEN,
      decimals: baseSepoliaAddresses.aaveV3.assets.WBTC.DECIMALS
    },
    {
      name: "WETH",
      underlying: baseSepoliaAddresses.aaveV3.assets.WETH.UNDERLYING,
      aToken: baseSepoliaAddresses.aaveV3.assets.WETH.A_TOKEN,
      decimals: baseSepoliaAddresses.aaveV3.assets.WETH.DECIMALS
    },
    {
      name: "cbETH",
      underlying: baseSepoliaAddresses.aaveV3.assets.cbETH.UNDERLYING,
      aToken: baseSepoliaAddresses.aaveV3.assets.cbETH.A_TOKEN,
      decimals: baseSepoliaAddresses.aaveV3.assets.cbETH.DECIMALS
    },
    {
      name: "LINK",
      underlying: baseSepoliaAddresses.aaveV3.assets.LINK.UNDERLYING,
      aToken: baseSepoliaAddresses.aaveV3.assets.LINK.A_TOKEN,
      decimals: baseSepoliaAddresses.aaveV3.assets.LINK.DECIMALS
    }
  ];

  console.log(`Deploying strategies for ${tokens.length} tokens...`);
  console.log("Aave Addresses Provider:", aaveAddressesProvider);

  // Initialize deployedContracts if it doesn't exist
  if (!addresses["84532"].deployedContracts) {
    addresses["84532"].deployedContracts = {};
  }

  // Deploy strategies for each token
  for (const token of tokens) {
    console.log(`\nDeploying AAVE strategy for ${token.name}...`);
    console.log(`Underlying: ${token.underlying}`);
    console.log(`aToken: ${token.aToken}`);

    try {
      // Deploy AAVEYieldStrategy
      const AAVEYieldStrategy = await hre.ethers.getContractFactory("AAVEYieldStrategy");
      const strategy = await AAVEYieldStrategy.deploy(
        aaveAddressesProvider,
        token.underlying,
        token.aToken
      );
      await strategy.waitForDeployment();

      const strategyAddress = await strategy.getAddress();
      console.log(`${token.name} strategy deployed to:`, strategyAddress);

      // Store the deployed strategy address
      const strategyKey = `AaveV3${token.name}Strategy`;
      addresses["84532"].deployedContracts[strategyKey] = strategyAddress;

      // Verify the contract
      console.log(`Verifying ${token.name} strategy...`);
      try {
        await hre.run("verify:verify", {
          address: strategyAddress,
          constructorArguments: [aaveAddressesProvider, token.underlying, token.aToken],
        });
        console.log(`${token.name} strategy verified successfully`);
      } catch (error) {
        console.log(`${token.name} strategy verification failed:`, error.message);
      }

    } catch (error) {
      console.error(`Failed to deploy ${token.name} strategy:`, error.message);
    }
  }

  // Save updated addresses.json
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("\n✅ Updated addresses.json with all deployed strategy addresses");

  // Print summary
  console.log("\n📋 Deployment Summary:");
  console.log("========================");
  for (const token of tokens) {
    const strategyKey = `AaveV3${token.name}Strategy`;
    const strategyAddress = addresses["84532"].deployedContracts[strategyKey];
    if (strategyAddress) {
      console.log(`${token.name}: ${strategyAddress}`);
    }
  }

  console.log("\n✅ AAVE Yield Strategies deployment for Base Sepolia completed!");
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✅ Base Sepolia AAVE strategies deployment completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Base Sepolia AAVE strategies deployment failed:", error);
      process.exit(1);
    });
} 