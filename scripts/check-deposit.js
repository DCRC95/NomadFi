// scripts/check-deposit.js
// Check what happened with the deposit transaction

const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Checking with account: ${deployer.address}`);
  console.log(`Network: ${hre.network.name}`);

  // Contract addresses
  const YIELD_AGGREGATOR_ADDRESS = "0x22954D73CE88998Bc66334A6D28dDA5EfAc9cfDf";
  const MOCK_ERC20_ADDRESS = "0xd0B01c1ce87508757FEB41C5D8b2D117a4f4c283";
  
  // Get contracts
  const YieldAggregator = await ethers.getContractAt("YieldAggregator", YIELD_AGGREGATOR_ADDRESS);
  const MockERC20 = await ethers.getContractAt("MockERC20", MOCK_ERC20_ADDRESS);
  
  // Check balances
  console.log("\n=== Balance Check ===");
  const aggregatorBalance = await MockERC20.balanceOf(YIELD_AGGREGATOR_ADDRESS);
  const deployerBalance = await MockERC20.balanceOf(deployer.address);
  const tokenContractBalance = await MockERC20.balanceOf(MOCK_ERC20_ADDRESS);
  
  console.log(`YieldAggregator balance: ${ethers.formatUnits(aggregatorBalance, 18)} tokens`);
  console.log(`Deployer balance: ${ethers.formatUnits(deployerBalance, 18)} tokens`);
  console.log(`Token contract balance: ${ethers.formatUnits(tokenContractBalance, 18)} tokens`);
  
  // Check allowances
  console.log("\n=== Allowance Check ===");
  const allowance = await MockERC20.allowance(deployer.address, YIELD_AGGREGATOR_ADDRESS);
  console.log(`Allowance for YieldAggregator: ${ethers.formatUnits(allowance, 18)} tokens`);
  
  // Check user deposits
  console.log("\n=== User Deposits Check ===");
  const strategyIds = await YieldAggregator.getAllStrategyIds();
  for (const strategyId of strategyIds) {
    const userDeposit = await YieldAggregator.userDeposits(deployer.address, MOCK_ERC20_ADDRESS, strategyId);
    console.log(`Strategy ${strategyId}: ${ethers.formatUnits(userDeposit, 18)} tokens deposited`);
  }
  
  // Check if tokens are supported
  console.log("\n=== Supported Tokens Check ===");
  const isSupported = await YieldAggregator.isSupportedToken(MOCK_ERC20_ADDRESS);
  console.log(`MockERC20 is supported: ${isSupported}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 