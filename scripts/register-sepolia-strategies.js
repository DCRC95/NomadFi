const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("📝 Registering Strategies with YieldAggregator");
  console.log("=============================================");

  // Load addresses.json
  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  
  const sepoliaAddresses = addresses["11155111"];
  const aggregatorAddress = sepoliaAddresses.yieldAggregator;
  
  console.log(`YieldAggregator: ${aggregatorAddress}`);

  // Get the YieldAggregator contract
  const YieldAggregator = await hre.ethers.getContractFactory("YieldAggregator");
  const aggregator = YieldAggregator.attach(aggregatorAddress);

  // Define strategies to register
  const strategies = [
    { id: 10, name: "LINK", asset: "LINK" },
    { id: 11, name: "WETH", asset: "WETH" },
    { id: 12, name: "USDC", asset: "USDC" },
    { id: 13, name: "WBTC", asset: "WBTC" },
    { id: 14, name: "AAVE", asset: "AAVE" },
    { id: 15, name: "EURS", asset: "EURS" }
  ];

  for (const strategy of strategies) {
    console.log(`\n📝 Registering ${strategy.name} strategy...`);
    
    const strategyAddress = addresses["11155111"].deployedContracts[`AaveV3${strategy.name}Strategy`];
    const underlyingToken = addresses["11155111"].aaveV3.assets[strategy.asset].UNDERLYING;
    
    console.log(`- Strategy ID: ${strategy.id}`);
    console.log(`- Strategy Address: ${strategyAddress}`);
    console.log(`- Underlying Token: ${underlyingToken}`);
    console.log(`- Strategy Name: AaveV3${strategy.name}Strategy`);
    console.log(`- Chain ID: 11155111`);
    console.log(`- Strategy Type: 1 (Aave)`);
    
    try {
      const tx = await aggregator.addStrategy(
        strategy.id,                    // _id
        underlyingToken,                // _tokenAddress
        strategyAddress,                // _strategyAddress
        `AaveV3${strategy.name}Strategy`, // _name
        11155111,                      // _chainId
        1                              // _strategyType (1 = Aave)
      );
      await tx.wait();
      console.log(`✅ ${strategy.name} strategy registered successfully`);
    } catch (error) {
      console.error(`❌ Failed to register ${strategy.name} strategy:`, error.message);
    }
  }

  console.log("\n🎉 Strategy Registration Complete!");
  console.log("==================================");
  console.log("All strategies have been registered with the YieldAggregator");
  console.log("\nNext step: Test TVL calculation");
  console.log("npx hardhat run scripts/test-sepolia-tvl.js --network sepolia");
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✅ Strategy registration successful!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Registration failed:", error);
      process.exit(1);
    });
}