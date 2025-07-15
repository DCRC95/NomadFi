// scripts/deploy_local.js
const { ethers, network } = require("hardhat");
const { getAddress } = require("ethers");

async function main() {
  // Deploy MockERC20
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockERC20 = await MockERC20.deploy();
  console.log(`MockERC20 deployed to: ${mockERC20.target}`);

  // Deploy MockYieldStrategy (local)
  const MockYieldStrategy = await ethers.getContractFactory("MockYieldStrategy");
  const mockYieldStrategy = await MockYieldStrategy.deploy(mockERC20.target);
  console.log(`MockYieldStrategy (local) deployed to: ${mockYieldStrategy.target}`);

  // Deploy YieldAggregator
  const YieldAggregator = await ethers.getContractFactory("YieldAggregator");
  const yieldAggregator = await YieldAggregator.deploy();
  console.log(`YieldAggregator deployed to: ${yieldAggregator.target}`);

  // Register the local MockYieldStrategy
  const localChainId = (await ethers.provider.getNetwork()).chainId;
  const tx1 = await yieldAggregator.addStrategy(
    mockYieldStrategy.target,
    localChainId,
    "Local Mock Strategy",
    "A local mock yield strategy for testing.",
    100, // baseRiskScore
    "ipfs://local-mock-strategy-metadata"
  );
  const receipt1 = await tx1.wait();
  const event1 = receipt1.logs.find(
    (log) => log.fragment && log.fragment.name === "StrategyAdded"
  );
  const strategyId1 = event1 ? event1.args.strategyId : undefined;
  if (!strategyId1) {
    console.error("StrategyAdded event not found for local strategy registration.");
  }
  console.log(`Registered Local Mock Strategy with strategyId: ${strategyId1} (chainId: ${localChainId})`);

  // Register a simulated Sepolia remote strategy
  const sepoliaChainId = 11155111;
  const remoteStrategyAddress = "0x000000000000000000000000000000000000dead";
  const tx2 = await yieldAggregator.addStrategy(
    remoteStrategyAddress,
    sepoliaChainId,
    "Sepolia Simulated Strategy",
    "A simulated remote strategy on Sepolia.",
    200, // baseRiskScore
    "ipfs://sepolia-simulated-strategy-metadata"
  );
  const receipt2 = await tx2.wait();
  const event2 = receipt2.logs.find(
    (log) => log.fragment && log.fragment.name === "StrategyAdded"
  );
  const strategyId2 = event2 ? event2.args.strategyId : undefined;
  if (!strategyId2) {
    console.error("StrategyAdded event not found for remote strategy registration.");
  }
  console.log(`Registered Sepolia Simulated Strategy with strategyId: ${strategyId2} (chainId: ${sepoliaChainId})`);

  // Output summary
  console.log("\n--- Deployment Summary ---");
  console.log(`MockERC20: ${mockERC20.target}`);
  console.log(`MockYieldStrategy (local): ${mockYieldStrategy.target}`);
  console.log(`YieldAggregator: ${yieldAggregator.target}`);
  console.log(`Local StrategyId: ${strategyId1} (chainId: ${localChainId})`);
  console.log(`Remote Sepolia StrategyId: ${strategyId2} (chainId: ${sepoliaChainId})`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 