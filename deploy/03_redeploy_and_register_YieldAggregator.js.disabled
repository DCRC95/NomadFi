// deploy/03_redeploy_and_register_YieldAggregator.js
// Redeploys YieldAggregator and registers three strategies as specified

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);
  console.log(`Network: ${hre.network.name}`);

  // 1. Deploy YieldAggregator
  const YieldAggregator = await hre.ethers.getContractFactory("YieldAggregator");
  const yieldAggregator = await YieldAggregator.deploy([]); // No initial supported tokens
  await yieldAggregator.waitForDeployment();
  console.log(`YieldAggregator deployed at: ${yieldAggregator.target}`);

  // 2. Register strategies
  // Enum: 0 = Mock, 1 = Aave
  const STRATEGY_TYPE_MOCK = 0;
  const STRATEGY_TYPE_AAVE = 1;

  // Strategy 1: Mock Sepolia
  const tx1 = await yieldAggregator.addStrategy(
    1,
    "0x8b80b737c954d5fB43B390C083d72E210248ec64",
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
    "0xd0B01c1ce87508757FEB41C5D8b2D117a4f4c283",
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
    "0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8",
    "0x16a3F97cb99aBb9D202588EdAFAb1E16a3Ce8edE",
    "Aave V3 USDC Sepolia Strategy",
    11155111,
    STRATEGY_TYPE_AAVE
  );
  await tx3.wait();
  console.log("Aave V3 USDC Sepolia Strategy registered. Tx:", tx3.hash);

  console.log("All strategies registered.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 