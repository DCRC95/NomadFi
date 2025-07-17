// scripts/aggregationredeploy.js
// Redeploy YieldAggregator with correct supported tokens for Amoy and Sepolia
// Usage: npx hardhat run scripts/aggregationredeploy.js --network <network>

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying YieldAggregator with account: ${deployer.address}`);
  console.log(`Network: ${hre.network.name}`);

  // Set supported token addresses for each network
  let initialSupportedTokens = [];
  if (hre.network.name === "amoy") {
    initialSupportedTokens = [
      "0xd0B01c1ce87508757FEB41C5D8b2D117a4f4c283", // Amoy MockERC20
    ];
  } else if (hre.network.name === "sepolia") {
    initialSupportedTokens = [
      "0x8b80b737c954d5fB43B390C083d72E210248ec64", // Sepolia MockERC20
    ];
  } else {
    throw new Error("Unsupported network for this deployment script");
  }

  // Deploy YieldAggregator with initial supported tokens
  const YieldAggregator = await ethers.getContractFactory("YieldAggregator");
  const yieldAggregator = await YieldAggregator.deploy(initialSupportedTokens);
  await yieldAggregator.waitForDeployment();
  console.log(`YieldAggregator deployed to: ${yieldAggregator.target}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 