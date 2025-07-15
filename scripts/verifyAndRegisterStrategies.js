// scripts/verifyAndRegisterStrategies.js
// This script verifies and registers strategies for the YieldAggregator contract on the Hardhat Network.
// Update the YIELD_AGGREGATOR_ADDRESS below with your deployed YieldAggregator address.

const { ethers } = require("hardhat");

// ====== USER ACTION REQUIRED ======
// Replace this with your deployed YieldAggregator address on Hardhat:
const YIELD_AGGREGATOR_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
// ==================================

// Validate the address format before proceeding
if (!/^0x[a-fA-F0-9]{40}$/.test(YIELD_AGGREGATOR_ADDRESS)) {
  throw new Error("YIELD_AGGREGATOR_ADDRESS must be a valid Ethereum address (0x...)");
}

// Placeholder for conceptual Sepolia MockYieldStrategy address
const SEPOLIA_MOCK_STRATEGY_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Not actually deployed, just for cross-chain awareness
const SEPOLIA_CHAIN_ID = 11155111;
const HARDHAT_CHAIN_ID = 31337;

async function main() {
  try {
    // Attach to deployed YieldAggregator
    const YieldAggregator = await ethers.getContractFactory("YieldAggregator");
    const yieldAggregator = YieldAggregator.attach(YIELD_AGGREGATOR_ADDRESS);

    // Deploy MockERC20 and MockYieldStrategy if not already deployed
    const [deployer] = await ethers.getSigners();
    console.log(`Using deployer: ${deployer.address}`);

    // Deploy MockERC20
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockERC20 = await MockERC20.deploy(); // No arguments needed
    await mockERC20.waitForDeployment();
    console.log(`MockERC20 deployed at: ${await mockERC20.getAddress()}`);

    // Deploy MockYieldStrategy
    const MockYieldStrategy = await ethers.getContractFactory("MockYieldStrategy");
    const mockYieldStrategy = await MockYieldStrategy.deploy(await mockERC20.getAddress());
    await mockYieldStrategy.waitForDeployment();
    const localMockStrategyAddress = await mockYieldStrategy.getAddress();
    console.log(`MockYieldStrategy deployed at: ${localMockStrategyAddress}`);

    // Check current strategies
    const strategyIds = await yieldAggregator.getAllStrategyIds();
    if (strategyIds.length === 0) {
      console.log("No strategies registered. Registering local and conceptual Sepolia strategies...");
      // Register local Hardhat strategy
      const tx1 = await yieldAggregator.addStrategy(
        localMockStrategyAddress,
        HARDHAT_CHAIN_ID,
        "Hardhat Local Mock Strategy",
        "A mock strategy deployed on Hardhat for local testing.",
        1, // baseRiskScore
        "" // offchainMetadataURI
      );
      await tx1.wait();
      console.log("Registered Hardhat Local Mock Strategy.");

      // Register conceptual Sepolia strategy
      const tx2 = await yieldAggregator.addStrategy(
        SEPOLIA_MOCK_STRATEGY_ADDRESS,
        SEPOLIA_CHAIN_ID,
        "Sepolia Conceptual Mock Strategy",
        "A conceptual mock strategy for Sepolia (not actually deployed).",
        2, // baseRiskScore
        "" // offchainMetadataURI
      );
      await tx2.wait();
      console.log("Registered Sepolia Conceptual Mock Strategy.");
    } else {
      console.log(`Strategies already registered (${strategyIds.length}). Skipping registration.`);
    }

    // List all registered strategies
    const allStrategyIds = await yieldAggregator.getAllStrategyIds();
    console.log("\nRegistered Strategies:");
    for (const id of allStrategyIds) {
      const info = await yieldAggregator.getStrategyInfo(id);
      const chainLabel =
        info.chainId.toString() === HARDHAT_CHAIN_ID.toString()
          ? "Hardhat"
          : info.chainId.toString() === SEPOLIA_CHAIN_ID.toString()
          ? "Sepolia"
          : info.chainId.toString();
      console.log(`\nStrategy ID: ${id}`);
      console.log(`  Name: ${info.name}`);
      console.log(`  Description: ${info.description}`);
      console.log(`  Chain ID: ${info.chainId} (${chainLabel})`);
      console.log(`  Address: ${info.strategyAddress}`);
      console.log(`  isActive: ${info.isActive}`);
      console.log(`  baseRiskScore: ${info.baseRiskScore}`);
      console.log(`  offchainMetadataURI: ${info.offchainMetadataURI}`);
    }
  } catch (err) {
    console.error("Error in verifyAndRegisterStrategies:", err);
    process.exit(1);
  }
}

main();