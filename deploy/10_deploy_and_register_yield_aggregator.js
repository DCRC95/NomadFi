const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying YieldAggregator with account: ${deployer.address}`);
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

  console.log("\n=== Loading Configuration ===");
  
  // Get all token addresses we need to support
  const supportedTokens = [];
  
  // Add WETH from Compound V3
  if (networkConfig.compoundV3?.WETH_UNDERLYING) {
    supportedTokens.push(networkConfig.compoundV3.WETH_UNDERLYING);
    console.log(`WETH: ${networkConfig.compoundV3.WETH_UNDERLYING}`);
  }
    
  // Add LINK from Aave V3
  if (networkConfig.aaveV3?.assets?.LINK?.UNDERLYING) {
    supportedTokens.push(networkConfig.aaveV3.assets.LINK.UNDERLYING);
    console.log(`LINK: ${networkConfig.aaveV3.assets.LINK.UNDERLYING}`);
  }

  if (supportedTokens.length === 0) {
    throw new Error('No supported tokens found in configuration');
  }

  console.log(`\nTotal tokens to support: ${supportedTokens.length}`);

  // Deploy YieldAggregator
  console.log("\n=== Deploying YieldAggregator ===");
  const YieldAggregator = await hre.ethers.getContractFactory("YieldAggregator");
  const yieldAggregator = await YieldAggregator.deploy(supportedTokens);
  await yieldAggregator.waitForDeployment();

  console.log(`✅ YieldAggregator deployed at: ${yieldAggregator.target}`);

  // Update addresses.json with new YieldAggregator address
  networkConfig.deployedContracts.YieldAggregator = yieldAggregator.target;
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("✅ Updated addresses.json with new YieldAggregator address");

  // Add supported tokens to YieldAggregator
  console.log("\n=== Adding Supported Tokens ===");
  for (const tokenAddress of supportedTokens) {
    try {
      console.log(`Adding supported token: ${tokenAddress}`);
      const tx = await yieldAggregator.addSupportedToken(tokenAddress);
      await tx.wait();
      console.log(`✅ Token ${tokenAddress} added as supported`);
    } catch (error) {
      console.error(`❌ Failed to add token ${tokenAddress}:`, error.message);
    }
  }

  // Approve tokens for YieldAggregator
  console.log("\n=== Approving Tokens for YieldAggregator ===");
  for (const tokenAddress of supportedTokens) {
    try {
      console.log(`Approving token: ${tokenAddress}`);
      const tokenContract = await hre.ethers.getContractAt("IERC20", tokenAddress);
      
      // Get token symbol for better logging
      let tokenSymbol = "Unknown";
      try {
        tokenSymbol = await tokenContract.symbol();
      } catch (e) {
        // If symbol() fails, use address
        tokenSymbol = tokenAddress.slice(0, 10) + "...";
      }

      // Approve YieldAggregator to spend tokens (max approval)
      const maxApproval = hre.ethers.parseUnits("1000000", 18); // 1M tokens
      const tx = await tokenContract.approve(yieldAggregator.target, maxApproval);
      await tx.wait();
      console.log(`✅ Approved ${tokenSymbol} (${tokenAddress}) for YieldAggregator`);
    } catch (error) {
      console.error(`❌ Failed to approve token ${tokenAddress}:`, error.message);
    }
  }

  // Register strategies
  console.log("\n=== Registering Strategies ===");

  // Strategy configurations
  const strategies = [
    {
      name: "CompoundWETHStrategy",
      tokenAddress: networkConfig.compoundV3?.WETH_UNDERLYING,
      strategyAddress: networkConfig.deployedContracts?.CompoundWETHStrategy,
      strategyType: 0, // Mock type (since Compound isn't in enum yet)
      description: "Compound V3 WETH yield strategy"
    },
    {
      name: "AaveV3LINKStrategy", 
      tokenAddress: networkConfig.aaveV3?.assets?.LINK?.UNDERLYING,
      strategyAddress: networkConfig.deployedContracts?.AaveV3LINKStrategy,
      strategyType: 1, // Aave type
      description: "Aave V3 LINK yield strategy"
    },
    {
      name: "MockYieldStrategy",
      tokenAddress: networkConfig.deployedContracts?.MockERC20,
      strategyAddress: networkConfig.deployedContracts?.MockYieldStrategy,
      strategyType: 0, // Mock type
      description: "Mock yield strategy for testing"
    }
  ];

  let strategyId = 0;
  const registeredStrategies = [];

  for (const strategy of strategies) {
    if (!strategy.strategyAddress || !strategy.tokenAddress) {
      console.log(`⚠️  Skipping ${strategy.name} - missing addresses`);
      continue;
    }

    console.log(`\n--- Registering ${strategy.name} ---`);
    console.log(`Strategy Address: ${strategy.strategyAddress}`);
    console.log(`Token Address: ${strategy.tokenAddress}`);
    console.log(`Strategy Type: ${strategy.strategyType}`);

    try {
      const tx = await yieldAggregator.addStrategy(
        strategyId,
        strategy.tokenAddress,
        strategy.strategyAddress,
        strategy.name,
        11155111, // Sepolia chain ID
        strategy.strategyType
      );

      console.log(`Transaction hash: ${tx.hash}`);
      await tx.wait();
      console.log(`✅ ${strategy.name} registered successfully with ID: ${strategyId}`);

      registeredStrategies.push({
        id: strategyId,
        name: strategy.name,
        address: strategy.strategyAddress,
        token: strategy.tokenAddress,
        type: strategy.strategyType
      });

      strategyId++;
    } catch (error) {
      console.error(`❌ Failed to register ${strategy.name}:`, error.message);
    }
  }

  // Verify registrations
  console.log("\n=== Verification ===");
  try {
    const allStrategyIds = await yieldAggregator.getAllStrategyIds();
    console.log(`Total strategies registered: ${allStrategyIds.length}`);

    for (const id of allStrategyIds) {
      const strategyInfo = await yieldAggregator.getStrategyInfo(id);
      console.log(`\nStrategy ID ${id}:`);
      console.log(`  Name: ${strategyInfo.name}`);
      console.log(`  Strategy Address: ${strategyInfo.strategyAddress}`);
      console.log(`  Token Address: ${strategyInfo.tokenAddress}`);
      console.log(`  Strategy Type: ${strategyInfo.strategyType}`);
      console.log(`  Active: ${strategyInfo.isActive}`);
    }
  } catch (error) {
    console.log("Could not verify strategies:", error.message);
  }

  // Summary
  console.log("\n=== Deployment Summary ===");
  console.log(`✅ YieldAggregator deployed at: ${yieldAggregator.target}`);
  console.log(`✅ Strategies registered: ${registeredStrategies.length}`);
  console.log(`✅ Supported tokens: ${supportedTokens.length}`);
  console.log(`✅ Token approvals: ${supportedTokens.length} tokens approved for YieldAggregator`);
  console.log(`🌐 Network: Sepolia (11155111)`);

  console.log("\n=== Registered Strategies ===");
  registeredStrategies.forEach(strategy => {
    console.log(`ID ${strategy.id}: ${strategy.name} (${strategy.address})`);
  });

  console.log("\n=== Supported & Approved Tokens ===");
  supportedTokens.forEach(token => {
    console.log(`- ${token} (Approved for YieldAggregator)`);
  });

  return {
    yieldAggregatorAddress: yieldAggregator.target,
    registeredStrategies: registeredStrategies,
    supportedTokens: supportedTokens
  };
}

main()
  .then((result) => {
    console.log("\n🎉 Deployment and registration completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 