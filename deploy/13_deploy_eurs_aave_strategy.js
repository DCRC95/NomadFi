const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying EURS Aave Strategy with account: ${deployer.address}`);
  console.log(`Network: ${hre.network.name}`);

  // Only deploy on Sepolia
  if (hre.network.config.chainId !== 11155111) {
    console.log('Skipping deployment - not on Sepolia');
    return;
  }

  // Load addresses.json
  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  if (!fs.existsSync(addressesPath)) {
    throw new Error('addresses.json not found');
  }

  const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
  const networkConfig = addresses['11155111'];
  
  if (!networkConfig) {
    throw new Error('Network configuration not found for Sepolia');
  }

  console.log("\n=== Loading EURS Configuration ===");
  
  // Get EURS configuration
  const eursConfig = networkConfig.aaveV3?.assets?.EURS;
  if (!eursConfig) {
    throw new Error('EURS configuration not found in addresses.json');
  }

  console.log(`EURS Underlying: ${eursConfig.UNDERLYING}`);
  console.log(`EURS aToken: ${eursConfig.A_TOKEN}`);
  console.log(`EURS Decimals: ${eursConfig.DECIMALS}`);
  console.log(`EURS Oracle: ${eursConfig.ORACLE}`);

  // Get existing YieldAggregator address
  const yieldAggregatorAddress = networkConfig.deployedContracts?.YieldAggregator;
  if (!yieldAggregatorAddress) {
    throw new Error('YieldAggregator address not found in addresses.json');
  }

  console.log(`\nYieldAggregator Address: ${yieldAggregatorAddress}`);

  // Deploy EURS Aave Strategy
  console.log("\n=== Deploying EURS Aave Strategy ===");
  const AAVEYieldStrategy = await hre.ethers.getContractFactory("AAVEYieldStrategy");
  
  const eursStrategy = await AAVEYieldStrategy.deploy(
    networkConfig.aaveV3.core.POOL_ADDRESSES_PROVIDER, // Aave addresses provider
    eursConfig.UNDERLYING,           // underlying token
    eursConfig.A_TOKEN               // aToken
  );
  
  await eursStrategy.waitForDeployment();

  console.log(`✅ EURS Aave Strategy deployed at: ${eursStrategy.target}`);

  // Update addresses.json with new EURS strategy address
  if (!networkConfig.deployedContracts) {
    networkConfig.deployedContracts = {};
  }
  networkConfig.deployedContracts.AaveV3EURSStrategy = eursStrategy.target;
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("✅ Updated addresses.json with new EURS strategy address");

  // Get YieldAggregator contract instance
  const yieldAggregator = await hre.ethers.getContractAt("YieldAggregator", yieldAggregatorAddress);

  // Add EURS as supported token to YieldAggregator
  console.log("\n=== Adding EURS as Supported Token ===");
  try {
    console.log(`Adding EURS as supported token: ${eursConfig.UNDERLYING}`);
    const addTokenTx = await yieldAggregator.addSupportedToken(eursConfig.UNDERLYING);
    await addTokenTx.wait();
    console.log(`✅ EURS token ${eursConfig.UNDERLYING} added as supported`);
  } catch (error) {
    console.error(`❌ Failed to add EURS token:`, error.message);
    // Check if token is already supported
    try {
      const isSupported = await yieldAggregator.isSupportedToken(eursConfig.UNDERLYING);
      if (isSupported) {
        console.log(`ℹ️  EURS token is already supported`);
      }
    } catch (checkError) {
      console.error(`❌ Could not check if EURS is supported:`, checkError.message);
    }
  }

  // Get next available strategy ID
  console.log("\n=== Getting Next Strategy ID ===");
  let nextStrategyId;
  try {
    const allStrategyIds = await yieldAggregator.getAllStrategyIds();
    nextStrategyId = allStrategyIds.length;
    console.log(`Next strategy ID: ${nextStrategyId}`);
  } catch (error) {
    console.log("Could not get existing strategy IDs, starting from 0");
    nextStrategyId = 0;
  }

  // Register EURS strategy with YieldAggregator
  console.log("\n=== Registering EURS Strategy ===");
  try {
    console.log(`Registering EURS strategy with ID: ${nextStrategyId}`);
    console.log(`Strategy Address: ${eursStrategy.target}`);
    console.log(`Token Address: ${eursConfig.UNDERLYING}`);
    console.log(`Strategy Type: 1 (Aave)`);

    const registerTx = await yieldAggregator.addStrategy(
      nextStrategyId,
      eursConfig.UNDERLYING,         // token address
      eursStrategy.target,           // strategy address
      "AaveV3EURSStrategy",          // strategy name
      11155111,                      // chain ID (Sepolia)
      1                              // strategy type (Aave = 1)
    );

    console.log(`Transaction hash: ${registerTx.hash}`);
    await registerTx.wait();
    console.log(`✅ EURS strategy registered successfully with ID: ${nextStrategyId}`);
  } catch (error) {
    console.error(`❌ Failed to register EURS strategy:`, error.message);
  }

  // Verify registration
  console.log("\n=== Verification ===");
  try {
    const strategyInfo = await yieldAggregator.getStrategyInfo(nextStrategyId);
    console.log(`\nStrategy ID ${nextStrategyId}:`);
    console.log(`  Name: ${strategyInfo.name}`);
    console.log(`  Strategy Address: ${strategyInfo.strategyAddress}`);
    console.log(`  Token Address: ${strategyInfo.tokenAddress}`);
    console.log(`  Strategy Type: ${strategyInfo.strategyType}`);
    console.log(`  Active: ${strategyInfo.isActive}`);
  } catch (error) {
    console.log("Could not verify strategy registration:", error.message);
  }

  // Test strategy functions
  console.log("\n=== Testing Strategy Functions ===");
  try {
    const apy = await eursStrategy.getAPY();
    console.log(`Strategy APY: ${apy.toString()}`);
  } catch (error) {
    console.log("Could not get strategy APY:", error.message);
  }

  // Summary
  console.log("\n=== Deployment Summary ===");
  console.log(`✅ EURS Aave Strategy deployed at: ${eursStrategy.target}`);
  console.log(`✅ EURS token added as supported: ${eursConfig.UNDERLYING}`);
  console.log(`✅ EURS strategy registered with ID: ${nextStrategyId}`);
  console.log(`✅ Strategy type: Aave (1)`);
  console.log(`🌐 Network: Sepolia (11155111)`);

  return {
    eursStrategyAddress: eursStrategy.target,
    eursTokenAddress: eursConfig.UNDERLYING,
    strategyId: nextStrategyId
  };
}

main()
  .then((result) => {
    console.log("\n🎉 EURS Aave Strategy deployment completed successfully!");
    console.log(`\nContract Addresses:`);
    console.log(`- EURS Strategy: ${result.eursStrategyAddress}`);
    console.log(`- EURS Token: ${result.eursTokenAddress}`);
    console.log(`- Strategy ID: ${result.strategyId}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ EURS Aave Strategy deployment failed:", error);
    process.exit(1);
  }); 