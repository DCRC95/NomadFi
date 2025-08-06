// scripts/deploy.ts
// Week 4, Phase 1: Smart Contract Deployment to Testnets
//
// Deploys MockERC20 and MockYieldStrategy to all networks.
// Deploys YieldAggregator ONLY to Polygon Amoy (network name: 'amoy').
//
// Usage:
//   npx hardhat run scripts/deploy.ts --network localhost
//   npx hardhat run scripts/deploy.ts --network sepolia
//   npx hardhat run scripts/deploy.ts --network amoy
//
// After deployment, update:
//   - pages/api/strategies.ts with the actual deployed addresses for YieldAggregator (Sepolia/Amoy) and MockERC20/MockYieldStrategy for all networks.
//   - Any frontend config that uses hardcoded contract addresses.
//
// NOTE: You must have testnet ETH/MATIC in your deployer wallet for Sepolia and Amoy.

import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);
  console.log(`Network: ${hre.network.name}`);

  // Deploy MockERC20
  console.log("Deploying MockERC20...");
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const mockERC20 = await MockERC20.deploy();
  await mockERC20.waitForDeployment();
  console.log(`MockERC20 deployed to: ${mockERC20.target}`);

  // Deploy MockYieldStrategy (pass MockERC20 address)
  console.log("Deploying MockYieldStrategy...");
  const MockYieldStrategy = await hre.ethers.getContractFactory("MockYieldStrategy");
  const mockYieldStrategy = await MockYieldStrategy.deploy(mockERC20.target);
  await mockYieldStrategy.waitForDeployment();
  console.log(`MockYieldStrategy deployed to: ${mockYieldStrategy.target}`);

  // Only deploy YieldAggregator on Amoy
  if (hre.network.name === "amoy") {
    console.log("Deploying YieldAggregator (Amoy only) ...");
    const YieldAggregator = await hre.ethers.getContractFactory("YieldAggregator");
    const yieldAggregator = await YieldAggregator.deploy();
    await yieldAggregator.waitForDeployment();
    console.log(`YieldAggregator deployed to: ${yieldAggregator.target}`);

    // Example: Register strategies after deployment (pseudo-code, update as needed)
    // await yieldAggregator.addStrategy(
    //   1, // id
    //   mockERC20.target, // token address
    //   mockYieldStrategy.target, // strategy address
    //   "Mock Yield Sepolia", // name
    //   11155111, // chainId for Sepolia
    //   0 // StrategyType.Mock
    // );
    //
    // For Amoy:
    // await yieldAggregator.addStrategy(
    //   2, // id
    //   mockERC20.target, // token address
    //   mockYieldStrategy.target, // strategy address
    //   "Mock Yield Amoy", // name
    //   80002, // chainId for Amoy
    //   0 // StrategyType.Mock
    // );
  } else {
    console.log("Skipping YieldAggregator deployment (only deployed on Amoy)");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 