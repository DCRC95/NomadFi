// scripts/verifyAndRegisterStrategies.ts
// Registers MockYieldStrategy contracts (Amoy and Sepolia) with the deployed YieldAggregator on Polygon Amoy.
//
// Usage:
//   npx hardhat run scripts/verifyAndRegisterStrategies.ts --network amoy
//
// IMPORTANT: Update pages/api/strategies.ts with these names, addresses, and chain IDs for consistent frontend display.

require("@nomicfoundation/hardhat-ethers");
import hre from "hardhat";

// Replace these with your actual deployed addresses
const YIELD_AGGREGATOR_ADDRESS = "0xf8BCC457c406a30e00340f4b78436f21a57073BA"; // Amoy
const AMOY_MOCK_STRATEGY_ADDRESS = "0xEcC14061E9c3aa3cc1102d668c1b9e8c3da19392";
const SEPOLIA_MOCK_STRATEGY_ADDRESS = "0x2B3e7E84e4be132EB85c0180148c62fbDf6a7DCA";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Using deployer: ${deployer.address}`);
  console.log(`Network: ${hre.network.name}`);

  // Instantiate YieldAggregator on Amoy
  const YieldAggregator = await hre.ethers.getContractAt("YieldAggregator", YIELD_AGGREGATOR_ADDRESS);

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