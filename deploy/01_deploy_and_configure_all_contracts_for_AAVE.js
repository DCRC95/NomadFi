// deploy/01_deploy_and_configure_all_contracts_for_AAVE.js
// Deploys AAVEYieldStrategy and YieldAggregator, then registers strategies

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);
  console.log(`Network: ${hre.network.name}`);

  // --- ENVIRONMENT VARIABLES ---
  const AAVE_V3_ADDRESSES_PROVIDER_SEPOLIA = process.env.AAVE_V3_ADDRESSES_PROVIDER_SEPOLIA;
  if (!AAVE_V3_ADDRESSES_PROVIDER_SEPOLIA) {
    throw new Error("Missing env var: AAVE_V3_ADDRESSES_PROVIDER_SEPOLIA");
  }

  // --- CONSTANTS ---
  // Sepolia Aave V3 USDC
  const USDC_SEPOLIA = "0x65aFADD39029741B3b8f0756952C74678c9cEC93";
  const aUSDC_SEPOLIA = "0x2271e3Fef9e15046d09E1d78a8FF038c691E9Cf9";

  // Amoy Mock
  const AMOY_MOCK_ERC20 = "0xd0B01c1ce87508757FEB41C5D8b2D117a4f4c283";
  const AMOY_MOCK_YIELD_STRATEGY = "0xEcC14061E9c3aa3cc1102d668c1b9e8c3da19392";

  // Sepolia Mock
  const SEPOLIA_MOCK_ERC20 = "0x8b80b737c954d5fB43B390C083d72E210248ec64";
  const SEPOLIA_MOCK_YIELD_STRATEGY = "0x2B3e7E84e4be132EB85c0180148c62fbDf6a7DCA";

  console.log("AAVE_V3_ADDRESSES_PROVIDER_SEPOLIA:", AAVE_V3_ADDRESSES_PROVIDER_SEPOLIA);
  console.log("USDC_SEPOLIA:", USDC_SEPOLIA);
  console.log("aUSDC_SEPOLIA:", aUSDC_SEPOLIA);

  // --- DEPLOY AAVEYieldStrategy ---
  console.log("Deploying AAVEYieldStrategy...");
  const AAVEYieldStrategy = await hre.ethers.getContractFactory("AAVEYieldStrategy");
  const aaveYieldStrategy = await AAVEYieldStrategy.deploy(
    AAVE_V3_ADDRESSES_PROVIDER_SEPOLIA,
    USDC_SEPOLIA,
    aUSDC_SEPOLIA
  );
  await aaveYieldStrategy.waitForDeployment();
  console.log(`AAVEYieldStrategy deployed at: ${aaveYieldStrategy.target}`);

  // --- DEPLOY YieldAggregator ---
  console.log("Deploying YieldAggregator...");
  const YieldAggregator = await hre.ethers.getContractFactory("YieldAggregator");
  const yieldAggregator = await YieldAggregator.deploy([]); // No initial supported tokens
  await yieldAggregator.waitForDeployment();
  console.log(`YieldAggregator deployed at: ${yieldAggregator.target}`);

  // --- Register Strategies ---
  const aggregator = await hre.ethers.getContractAt(
    "YieldAggregator",
    yieldAggregator.target,
    deployer
  );

  // StrategyType enum: 0 = Mock, 1 = Aave
  const STRATEGY_TYPE_MOCK = 0;
  const STRATEGY_TYPE_AAVE = 1;

  // Strategy 1: Aave V3 USDC
  const idAave = 1;
  console.log("Adding AaveV3USDCStrategy...");
  await (await aggregator.addStrategy(
    idAave,
    USDC_SEPOLIA,
    aaveYieldStrategy.target,
    "Aave V3 USDC Yield",
    STRATEGY_TYPE_AAVE
  )).wait();
  console.log("AaveV3USDCStrategy registered.");

  // Strategy 2: Amoy Mock
  const idAmoyMock = 2;
  console.log("Adding AmoyMockStrategy...");
  await (await aggregator.addStrategy(
    idAmoyMock,
    AMOY_MOCK_ERC20,
    AMOY_MOCK_YIELD_STRATEGY,
    "Mock Amoy Yield",
    STRATEGY_TYPE_MOCK
  )).wait();
  console.log("AmoyMockStrategy registered.");

  // Strategy 3: Sepolia Mock
  const idSepoliaMock = 3;
  console.log("Adding SepoliaMockStrategy...");
  await (await aggregator.addStrategy(
    idSepoliaMock,
    SEPOLIA_MOCK_ERC20,
    SEPOLIA_MOCK_YIELD_STRATEGY,
    "Mock Sepolia Yield",
    STRATEGY_TYPE_MOCK
  )).wait();
  console.log("SepoliaMockStrategy registered.");

  console.log("All contracts deployed and strategies registered.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 