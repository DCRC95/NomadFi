const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Adding underlying currencies as supported tokens...");

  // Load addresses.json
  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  
  const sepoliaAddresses = addresses["11155111"];
  const aggregatorAddress = sepoliaAddresses.yieldAggregator;
  
  console.log("YieldAggregator address:", aggregatorAddress);

  // Get the YieldAggregator contract
  const YieldAggregator = await hre.ethers.getContractFactory("YieldAggregator");
  const aggregator = YieldAggregator.attach(aggregatorAddress);

  // Get all underlying token addresses
  const underlyingTokens = [
    {
      name: "LINK",
      address: sepoliaAddresses.aaveV3.assets.LINK.UNDERLYING
    },
    {
      name: "WETH", 
      address: sepoliaAddresses.aaveV3.assets.WETH.UNDERLYING
    },
    {
      name: "USDC",
      address: sepoliaAddresses.aaveV3.assets.USDC.UNDERLYING
    },
    {
      name: "WBTC",
      address: sepoliaAddresses.aaveV3.assets.WBTC.UNDERLYING
    },
    {
      name: "AAVE",
      address: sepoliaAddresses.aaveV3.assets.AAVE.UNDERLYING
    },
    {
      name: "EURS",
      address: sepoliaAddresses.aaveV3.assets.EURS.UNDERLYING
    },
    {
      name: "DAI",
      address: sepoliaAddresses.aaveV3.assets.DAI.UNDERLYING
    },
    {
      name: "USDT",
      address: sepoliaAddresses.aaveV3.assets.USDT.UNDERLYING
    }
  ];

  console.log(`Found ${underlyingTokens.length} underlying tokens to add`);

  // Add each token as supported
  for (const token of underlyingTokens) {
    try {
      console.log(`\nAdding ${token.name} as supported token: ${token.address}`);
      
      const tx = await aggregator.addSupportedToken(token.address);
      await tx.wait();
      
      console.log(`✅ ${token.name} added successfully`);
      
      // Add delay between transactions
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Failed to add ${token.name}:`, error.message);
    }
  }

  // Verify all tokens are supported
  console.log("\nVerifying supported tokens...");
  for (const token of underlyingTokens) {
    try {
      const isSupported = await aggregator.isSupportedToken(token.address);
      console.log(`${token.name} (${token.address}): ${isSupported ? '✅ Supported' : '❌ Not supported'}`);
    } catch (error) {
      console.error(`Error checking ${token.name}:`, error.message);
    }
  }

  console.log("\n✅ Token support setup completed!");
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✅ Token support setup completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Token support setup failed:", error);
      process.exit(1);
    });
} 