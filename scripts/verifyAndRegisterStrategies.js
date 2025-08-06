// scripts/verifyAndRegisterStrategies.js
// Registers MockYieldStrategy contracts (Amoy and Sepolia) with the deployed YieldAggregator on Polygon Amoy.
//
// Usage:
//   npx hardhat run scripts/verifyAndRegisterStrategies.js --network amoy
//
// IMPORTANT: Update pages/api/strategies.ts with these names, addresses, and chain IDs for consistent frontend display.

const { ethers } = require("hardhat");
const hre = require("hardhat");

// Replace these with your actual deployed addresses
const YIELD_AGGREGATOR_ADDRESS = "0x22954D73CE88998Bc66334A6D28dDA5EfAc9cfDf"; // New Amoy aggregator address
const AMOY_MOCK_STRATEGY_ADDRESS = "0xEcC14061E9c3aa3cc1102d668c1b9e8c3da19392"; // Amoy strategy address
const SEPOLIA_MOCK_STRATEGY_ADDRESS = "0x2B3e7E84e4be132EB85c0180148c62fbDf6a7DCA"; // Sepolia strategy address

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Using deployer: ${deployer.address}`);
  console.log(`Network: ${hre.network.name}`);

  // Instantiate YieldAggregator on Amoy
  const YieldAggregator = await ethers.getContractAt("YieldAggregator", YIELD_AGGREGATOR_ADDRESS);

  // Register Amoy MockYieldStrategy
  console.log("Registering Polygon Amoy MockYieldStrategy...");
  const tx1 = await YieldAggregator.addStrategy(
    AMOY_MOCK_STRATEGY_ADDRESS,
    80002, // Amoy chainId
    "Polygon Amoy Strategy",
    "A mock yield strategy on Polygon Amoy.",
    100, // baseRiskScore
    "ipfs://amoy-mock-strategy-metadata"
  );
  console.log(`Amoy addStrategy tx: ${tx1.hash}`);
  await tx1.wait();
  console.log("Polygon Amoy MockYieldStrategy registered.");

  // Register Sepolia MockYieldStrategy (as a remote strategy)
  console.log("Registering Ethereum Sepolia MockYieldStrategy...");
  const tx2 = await YieldAggregator.addStrategy(
    SEPOLIA_MOCK_STRATEGY_ADDRESS,
    11155111, // Sepolia chainId
    "Ethereum Sepolia Strategy",
    "A mock yield strategy on Ethereum Sepolia.",
    200, // baseRiskScore
    "ipfs://sepolia-mock-strategy-metadata"
  );
  console.log(`Sepolia addStrategy tx: ${tx2.hash}`);
  await tx2.wait();
  console.log("Ethereum Sepolia MockYieldStrategy registered.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });