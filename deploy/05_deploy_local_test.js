// deploy/05_deploy_local_test.js
// Deploys YieldAggregator, MockERC20, and MockYieldStrategy on local Hardhat network for testing

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);
  console.log(`Network: ${hre.network.name}`);
  console.log(`Account balance: ${hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH`);

  // 1. Deploy MockERC20
  console.log("\n1. Deploying MockERC20...");
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const mockERC20 = await MockERC20.deploy();
  await mockERC20.waitForDeployment();
  console.log(`MockERC20 deployed at: ${mockERC20.target}`);

  // 2. Deploy MockYieldStrategy
  console.log("\n2. Deploying MockYieldStrategy...");
  const MockYieldStrategy = await hre.ethers.getContractFactory("MockYieldStrategy");
  const mockYieldStrategy = await MockYieldStrategy.deploy(mockERC20.target);
  await mockYieldStrategy.waitForDeployment();
  console.log(`MockYieldStrategy deployed at: ${mockYieldStrategy.target}`);

  // 3. Deploy Enhanced YieldAggregator
  console.log("\n3. Deploying Enhanced YieldAggregator...");
  const YieldAggregator = await hre.ethers.getContractFactory("YieldAggregator");
  const yieldAggregator = await YieldAggregator.deploy([]); // No initial supported tokens
  await yieldAggregator.waitForDeployment();
  console.log(`Enhanced YieldAggregator deployed at: ${yieldAggregator.target}`);

  // 4. Add MockERC20 as supported token
  console.log("\n4. Adding MockERC20 as supported token...");
  const addTokenTx = await yieldAggregator.addSupportedToken(mockERC20.target);
  await addTokenTx.wait();
  console.log(`MockERC20 added as supported token`);

  // 5. Register MockYieldStrategy
  console.log("\n5. Registering MockYieldStrategy...");
  const STRATEGY_TYPE_MOCK = 0;
  const addStrategyTx = await yieldAggregator.addStrategy(
    1, // strategy ID
    mockERC20.target, // token address
    mockYieldStrategy.target, // strategy address
    "Local Test Strategy", // name
    31337, // chainId (Hardhat)
    STRATEGY_TYPE_MOCK
  );
  await addStrategyTx.wait();
  console.log(`MockYieldStrategy registered with ID: 1`);

  // 6. Mint some tokens to deployer for testing
  console.log("\n6. Minting test tokens to deployer...");
  const mintAmount = hre.ethers.parseEther("1000"); // 1000 tokens
  const mintTx = await mockERC20.mint(mintAmount);
  await mintTx.wait();
  console.log(`Minted ${hre.ethers.formatEther(mintAmount)} tokens to ${deployer.address}`);
  console.log(`Deployer token balance: ${hre.ethers.formatEther(await mockERC20.balanceOf(deployer.address))} tokens`);

  // 7. Test the new comprehensive functions
  console.log("\n7. Testing comprehensive data functions...");
  
  // Test getStrategyData
  try {
    const strategyData = await yieldAggregator.getStrategyData(1);
    console.log("✅ getStrategyData() works:");
    console.log(`  - Token Address: ${strategyData.tokenAddress}`);
    console.log(`  - Strategy Address: ${strategyData.strategyAddress}`);
    console.log(`  - Name: ${strategyData.name}`);
    console.log(`  - Chain ID: ${strategyData.chainId}`);
    console.log(`  - Strategy Type: ${strategyData.strategyType}`);
    console.log(`  - Is Active: ${strategyData.isActive}`);
    console.log(`  - APY: ${strategyData.apy}`);
    console.log(`  - Total Deposits: ${strategyData.totalDeposits}`);
    console.log(`  - Total Value Locked: ${strategyData.totalValueLocked}`);
  } catch (error) {
    console.log("❌ getStrategyData() failed:", error.message);
  }

  // Test getUserData
  try {
    const userData = await yieldAggregator.getUserData(deployer.address, 1);
    console.log("✅ getUserData() works:");
    console.log(`  - Balance: ${hre.ethers.formatEther(userData.balance)} tokens`);
    console.log(`  - Allowance: ${hre.ethers.formatEther(userData.allowance)} tokens`);
    console.log(`  - Deposited Amount: ${hre.ethers.formatEther(userData.depositedAmount)} tokens`);
    console.log(`  - Needs Approval: ${userData.needsApproval}`);
  } catch (error) {
    console.log("❌ getUserData() failed:", error.message);
  }

  // Test getStrategyAPY
  try {
    const apy = await yieldAggregator.getStrategyAPY(1);
    console.log(`✅ getStrategyAPY() works: ${apy} basis points`);
  } catch (error) {
    console.log("❌ getStrategyAPY() failed:", error.message);
  }

  // 8. Test batch functions
  console.log("\n8. Testing batch functions...");
  try {
    const batchStrategyData = await yieldAggregator.getBatchStrategyData([1]);
    console.log(`✅ getBatchStrategyData() works: ${batchStrategyData.length} strategies returned`);
    
    const batchUserData = await yieldAggregator.getBatchUserData(deployer.address, [1]);
    console.log(`✅ getBatchUserData() works: ${batchUserData.length} user data entries returned`);
  } catch (error) {
    console.log("❌ Batch functions failed:", error.message);
  }

  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log(`MockERC20: ${mockERC20.target}`);
  console.log(`MockYieldStrategy: ${mockYieldStrategy.target}`);
  console.log(`Enhanced YieldAggregator: ${yieldAggregator.target}`);
  console.log(`Strategy ID: 1`);
  console.log(`Deployer Address: ${deployer.address}`);
  console.log(`Deployer Token Balance: ${hre.ethers.formatEther(await mockERC20.balanceOf(deployer.address))} tokens`);
  
  console.log("\n=== TESTING COMMANDS ===");
  console.log("To test deposits:");
  console.log(`1. Approve: await mockERC20.approve("${yieldAggregator.target}", ethers.MaxUint256)`);
  console.log(`2. Deposit: await yieldAggregator.deposit("${mockERC20.target}", ethers.parseEther("10"), 1)`);
  console.log(`3. Check: await yieldAggregator.getUserData("${deployer.address}", 1)`);
  
  console.log("\n=== FRONTEND TESTING ===");
  console.log("Update your frontend environment variables:");
  console.log(`NEXT_PUBLIC_YIELD_AGGREGATOR_ADDRESS=${yieldAggregator.target}`);
  console.log(`NEXT_PUBLIC_MOCK_ERC20_ADDRESS=${mockERC20.target}`);
  console.log(`NEXT_PUBLIC_MOCK_YIELD_STRATEGY_ADDRESS=${mockYieldStrategy.target}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 