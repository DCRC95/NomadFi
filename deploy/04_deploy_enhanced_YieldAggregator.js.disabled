// deploy/04_deploy_enhanced_YieldAggregator.js
// Deploys the enhanced YieldAggregator with comprehensive data functions

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying enhanced YieldAggregator with account: ${deployer.address}`);
  console.log(`Network: ${hre.network.name}`);

  // 1. Deploy Enhanced YieldAggregator
  console.log("Deploying Enhanced YieldAggregator...");
  const YieldAggregator = await hre.ethers.getContractFactory("YieldAggregator");
  const yieldAggregator = await YieldAggregator.deploy([]); // No initial supported tokens
  await yieldAggregator.waitForDeployment();
  console.log(`Enhanced YieldAggregator deployed at: ${yieldAggregator.target}`);

  // 2. Add supported tokens
  console.log("Adding supported tokens...");
  
  // Sepolia tokens
  const USDC_SEPOLIA = "0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8";
  const LINK_SEPOLIA = "0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5";
  
  // Amoy tokens
  const AMOY_MOCK_ERC20 = "0xd0B01c1ce87508757FEB41C5D8b2D117a4f4c283";
  
  // Sepolia Mock tokens
  const SEPOLIA_MOCK_ERC20 = "0x8b80b737c954d5fB43B390C083d72E210248ec64";

  // Add all supported tokens
  const supportedTokens = [USDC_SEPOLIA, LINK_SEPOLIA, AMOY_MOCK_ERC20, SEPOLIA_MOCK_ERC20];
  
  for (const token of supportedTokens) {
    const tx = await yieldAggregator.addSupportedToken(token);
    await tx.wait();
    console.log(`Added supported token: ${token}`);
  }

  // 3. Register strategies
  console.log("Registering strategies...");
  
  // Enum: 0 = Mock, 1 = Aave
  const STRATEGY_TYPE_MOCK = 0;
  const STRATEGY_TYPE_AAVE = 1;

  // Strategy 1: Mock Sepolia
  const tx1 = await yieldAggregator.addStrategy(
    1,
    SEPOLIA_MOCK_ERC20,
    "0x2B3e7E84e4be132EB85c0180148c62fbDf6a7DCA",
    "Mock Sepolia Strategy",
    11155111,
    STRATEGY_TYPE_MOCK
  );
  await tx1.wait();
  console.log("Mock Sepolia Strategy registered. Tx:", tx1.hash);

  // Strategy 2: Mock Amoy
  const tx2 = await yieldAggregator.addStrategy(
    2,
    AMOY_MOCK_ERC20,
    "0xEcC14061E9c3aa3cc1102d668c1b9e8c3da19392",
    "Mock Amoy Strategy",
    80002,
    STRATEGY_TYPE_MOCK
  );
  await tx2.wait();
  console.log("Mock Amoy Strategy registered. Tx:", tx2.hash);

  // Strategy 3: Aave V3 USDC Sepolia
  const tx3 = await yieldAggregator.addStrategy(
    3,
    USDC_SEPOLIA,
    "0x16a3F97cb99aBb9D202588EdAFAb1E16a3Ce8edE",
    "Aave V3 USDC Sepolia Strategy",
    11155111,
    STRATEGY_TYPE_AAVE
  );
  await tx3.wait();
  console.log("Aave V3 USDC Sepolia Strategy registered. Tx:", tx3.hash);

  // Strategy 4: Aave V3 LINK Sepolia
  const tx4 = await yieldAggregator.addStrategy(
    4,
    LINK_SEPOLIA,
    "0x3C96145eb50db60F177079e8416c634EcA5141f6",
    "Aave V3 LINK Sepolia Strategy",
    11155111,
    STRATEGY_TYPE_AAVE
  );
  await tx4.wait();
  console.log("Aave V3 LINK Sepolia Strategy registered. Tx:", tx4.hash);

  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log(`Enhanced YieldAggregator: ${yieldAggregator.target}`);
  console.log("Supported Tokens:", supportedTokens);
  console.log("Strategies Registered: 4");
  console.log("1. Mock Sepolia Strategy (ID: 1)");
  console.log("2. Mock Amoy Strategy (ID: 2)");
  console.log("3. Aave V3 USDC Sepolia Strategy (ID: 3)");
  console.log("4. Aave V3 LINK Sepolia Strategy (ID: 4)");
  
  console.log("\n=== NEXT STEPS ===");
  console.log("1. Update frontend to use new comprehensive data functions");
  console.log("2. Update environment variables with new contract address");
  console.log("3. Test the new getStrategyData() and getUserData() functions");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 