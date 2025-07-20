const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Registering CompoundWETHStrategy with account: ${deployer.address}`);
  console.log(`Network: ${hre.network.name}`);

  // Only register on Sepolia
  if (hre.network.config.chainId !== 11155111) {
    console.log('Skipping strategy registration - not on Sepolia');
    return;
  }

  // Load addresses.json
  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  if (!fs.existsSync(addressesPath)) {
    throw new Error('addresses.json not found');
  }

  const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
  
  // Get network configuration
  const networkConfig = addresses['11155111'];
  if (!networkConfig) {
    throw new Error('Network configuration not found for Sepolia');
  }

  // Get YieldAggregator address
  const yieldAggregatorAddress = networkConfig.deployedContracts?.YieldAggregator;
  if (!yieldAggregatorAddress) {
    throw new Error('YieldAggregator address not found in addresses.json');
  }

  // Get CompoundWETHStrategy address
  const strategyAddress = networkConfig.deployedContracts?.CompoundWETHStrategy;
  if (!strategyAddress) {
    throw new Error('CompoundWETHStrategy address not found in addresses.json');
  }

  // Get WETH token address from Compound V3 config
  const tokenAddress = networkConfig.compoundV3?.WETH_UNDERLYING;
  if (!tokenAddress) {
    throw new Error('WETH_UNDERLYING address not found in Compound V3 config');
  }

  console.log("\n=== Configuration ===");
  console.log(`Network: Sepolia`);
  console.log(`YieldAggregator: ${yieldAggregatorAddress}`);
  console.log(`Strategy: CompoundWETHStrategy`);
  console.log(`Strategy Address: ${strategyAddress}`);
  console.log(`Token Address: ${tokenAddress}`);
  console.log(`Strategy Type: 2 (Compound)`);
  console.log(`Base Risk Score: 3 (Medium)`);
  console.log(`Active: true`);

  // Get YieldAggregator contract
  const YieldAggregator = await hre.ethers.getContractFactory("YieldAggregator");
  const yieldAggregator = YieldAggregator.attach(yieldAggregatorAddress);

  // Check if strategy is already registered
  console.log("\n=== Checking existing strategies ===");
  try {
    const strategyIds = await yieldAggregator.getAllStrategyIds();
    console.log(`Total strategies registered: ${strategyIds.length}`);

    // Check if this strategy is already registered
    for (let i = 0; i < strategyIds.length; i++) {
      const strategyId = strategyIds[i];
      const strategyInfo = await yieldAggregator.getStrategyInfo(strategyId);
      if (strategyInfo.strategyAddress === strategyAddress) {
        console.log(`WARNING: Strategy already registered with ID: ${strategyId}`);
        console.log(`   Strategy Address: ${strategyInfo.strategyAddress}`);
        console.log(`   Token Address: ${strategyInfo.tokenAddress}`);
        console.log(`   Active: ${strategyInfo.isActive}`);
        return;
      }
    }
  } catch (error) {
    console.log("Could not check existing strategies:", error.message);
  }

  // Get next strategy ID
  const strategyIds = await yieldAggregator.getAllStrategyIds();
  const nextStrategyId = strategyIds.length;

  // Check if WETH token is supported
  console.log("\n=== Checking token support ===");
  const isWETHSupported = await yieldAggregator.isSupportedToken(tokenAddress);
  console.log(`WETH token supported: ${isWETHSupported}`);
  
  if (!isWETHSupported) {
    console.log("Adding WETH token as supported token...");
    const addTokenTx = await yieldAggregator.addSupportedToken(tokenAddress);
    await addTokenTx.wait();
    console.log("WETH token added as supported");
  }

  // Register the strategy (using Mock type since Compound isn't in the enum yet)
  console.log("\n=== Registering CompoundWETHStrategy ===");
  const tx = await yieldAggregator.addStrategy(
    nextStrategyId,
    tokenAddress,
    strategyAddress,
    "CompoundWETHStrategy",
    11155111, // Chain ID: Sepolia
    0 // Strategy Type: 0 = Mock (since Compound type doesn't exist yet)
  );

  console.log(`Transaction hash: ${tx.hash}`);
  console.log("Waiting for confirmation...");
  
  const receipt = await tx.wait();
  console.log(`SUCCESS: Strategy registered successfully!`);
  console.log(`   Block number: ${receipt.blockNumber}`);
  console.log(`   Gas used: ${receipt.gasUsed.toString()}`);

  // Get the new strategy ID
  const newStrategyIds = await yieldAggregator.getAllStrategyIds();
  const newStrategyId = newStrategyIds[newStrategyIds.length - 1];
  
  console.log(`\n=== Registration Summary ===`);
  console.log(`SUCCESS: Successfully registered CompoundWETHStrategy`);
  console.log(`Strategy ID: ${newStrategyId}`);
  console.log(`Strategy Address: ${strategyAddress}`);
  console.log(`Token Address: ${tokenAddress}`);
  console.log(`Network: Sepolia (11155111)`);
  console.log(`Description: Compound V3 WETH yield strategy on Sepolia testnet`);

  // Verify the registration
  console.log("\n=== Verification ===");
  const strategyInfo = await yieldAggregator.getStrategyInfo(newStrategyId);
  console.log(`Strategy ID ${newStrategyId} info:`);
  console.log(`  Strategy Address: ${strategyInfo.strategyAddress}`);
  console.log(`  Token Address: ${strategyInfo.tokenAddress}`);
  console.log(`  Strategy Type: ${strategyInfo.strategyType}`);
  console.log(`  Base Risk Score: ${strategyInfo.baseRiskScore}`);
  console.log(`  Active: ${strategyInfo.isActive}`);

  return {
    strategyId: newStrategyId,
    strategyAddress: strategyAddress,
    tokenAddress: tokenAddress,
    strategyType: 2,
    baseRiskScore: 3,
    isActive: true
  };
}

main()
  .then((result) => {
    console.log("\nStrategy registration completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Strategy registration failed:", error);
    process.exit(1);
  }); 