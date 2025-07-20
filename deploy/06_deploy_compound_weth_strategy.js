const fs = require('fs');
const path = require('path');

module.exports = async function ({ getNamedAccounts, deployments, getChainId }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  // Only deploy on Sepolia
  if (chainId !== '11155111') {
    log('Skipping CompoundWETHStrategy deployment - not on Sepolia');
    return;
  }

  log('Deploying CompoundWETHStrategy on Sepolia...');

  // Path to addresses.json
  const addressesPath = path.join(__dirname, '../constants/addresses.json');

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

  log(`Using Compound WETH Comet: ${compoundWETHCometAddress}`);
  log(`Using WETH Underlying: ${wethUnderlyingAddress}`);

  // Deploy CompoundWETHStrategy
  const compoundWETHStrategy = await deploy('CompoundWETHStrategy', {
    from: deployer,
    args: [compoundWETHCometAddress, wethUnderlyingAddress],
    log: true,
    waitConfirmations: 1,
  });

  log(`CompoundWETHStrategy deployed at: ${compoundWETHStrategy.address}`);

  // Update addresses.json with the deployed address
  addresses['11155111'].deployedContracts.CompoundWETHStrategy = compoundWETHStrategy.address;

  // Write back to addresses.json
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  log('Updated addresses.json with CompoundWETHStrategy address');
};

module.exports.tags = ['CompoundWETHStrategy']; 