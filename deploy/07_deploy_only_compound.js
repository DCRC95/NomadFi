const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying CompoundWETHStrategy with account: ${deployer.address}`);
  console.log(`Network: ${hre.network.name}`);

  // Only deploy on Sepolia
  if (hre.network.config.chainId !== 11155111) {
    console.log('Skipping CompoundWETHStrategy deployment - not on Sepolia');
    return;
  }

  console.log('Deploying CompoundWETHStrategy on Sepolia...');

  // Path to addresses.json
  const addressesPath = path.join(__dirname, "../constants/addresses.json");

  // Load addresses.json
  if (!fs.existsSync(addressesPath)) {
    throw new Error('addresses.json not found');
  }

  const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
  
  // Check if Compound V3 WETH addresses exist for Sepolia
  if (!addresses['11155111']?.compoundV3?.cWETHv3 || !addresses['11155111']?.compoundV3?.WETH_UNDERLYING) {
    throw new Error('Missing Compound V3 WETH addresses for Sepolia in addresses.json');
  }

  // Extract addresses
  const compoundWETHCometAddress = addresses['11155111'].compoundV3.cWETHv3;
  const wethUnderlyingAddress = addresses['11155111'].compoundV3.WETH_UNDERLYING;

  console.log(`Using Compound WETH Comet: ${compoundWETHCometAddress}`);
  console.log(`Using WETH Underlying: ${wethUnderlyingAddress}`);

  // Deploy CompoundWETHStrategy
  const CompoundWETHStrategy = await hre.ethers.getContractFactory("CompoundWETHStrategy");
  const compoundWETHStrategy = await CompoundWETHStrategy.deploy(
    compoundWETHCometAddress,
    wethUnderlyingAddress
  );
  await compoundWETHStrategy.waitForDeployment();

  console.log(`CompoundWETHStrategy deployed at: ${compoundWETHStrategy.target}`);

  // Update addresses.json with the deployed address
  addresses['11155111'].deployedContracts.CompoundWETHStrategy = compoundWETHStrategy.target;

  // Write back to addresses.json
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log('Updated addresses.json with CompoundWETHStrategy address');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 