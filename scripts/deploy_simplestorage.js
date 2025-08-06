// scripts/deploy_simplestorage.js
// Deploys SimpleStorage contract only
// Usage: npx hardhat run scripts/deploy_simplestorage.js --network <network>

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying SimpleStorage with account: ${deployer.address}`);
  console.log(`Network: ${network.name}`);

  const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
  const simpleStorage = await SimpleStorage.deploy();
  await simpleStorage.waitForDeployment();
  console.log(`SimpleStorage deployed to: ${simpleStorage.target}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 