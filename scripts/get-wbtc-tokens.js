// scripts/get-wbtc-tokens.js
// Get WBTC tokens from Aave faucet for testing

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Getting WBTC tokens with account: ${deployer.address}`);
  
  // Load addresses.json
  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  
  // Get WBTC token address
  const wbtcTokenAddress = addresses["11155111"].aaveV3?.assets?.WBTC?.UNDERLYING;
  console.log(`WBTC Token Address: ${wbtcTokenAddress}`);
  
  // Get Aave faucet address
  const aaveFaucetAddress = addresses["11155111"].aaveV3?.core?.FAUCET;
  console.log(`Aave Faucet Address: ${aaveFaucetAddress}`);
  
  // Create WBTC token contract
  const wbtcAbi = [
    "function balanceOf(address owner) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)"
  ];
  
  const wbtcToken = new hre.ethers.Contract(wbtcTokenAddress, wbtcAbi, hre.ethers.provider);
  
  // Check current balance
  const currentBalance = await wbtcToken.balanceOf(deployer.address);
  const decimals = await wbtcToken.decimals();
  const symbol = await wbtcToken.symbol();
  
  console.log(`\nCurrent ${symbol} balance: ${hre.ethers.formatUnits(currentBalance, decimals)}`);
  
  if (currentBalance > 0) {
    console.log("✅ You already have WBTC tokens!");
    return;
  }
  
  // Try to get tokens from Aave faucet
  console.log("\n=== Getting WBTC from Aave Faucet ===");
  
  const faucetAbi = [
    "function mint(address token, address to, uint256 amount) external"
  ];
  
  const faucet = new hre.ethers.Contract(aaveFaucetAddress, faucetAbi, deployer);
  
  try {
    // Try to mint 0.001 WBTC (100000 satoshis)
    const mintAmount = hre.ethers.parseUnits("0.001", decimals);
    console.log(`Attempting to mint ${hre.ethers.formatUnits(mintAmount, decimals)} ${symbol}...`);
    
    const tx = await faucet.mint(wbtcTokenAddress, deployer.address, mintAmount);
    console.log(`Transaction hash: ${tx.hash}`);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log(`✅ Successfully minted ${symbol}!`);
    console.log(`   Block number: ${receipt.blockNumber}`);
    console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
    
    // Check new balance
    const newBalance = await wbtcToken.balanceOf(deployer.address);
    console.log(`New ${symbol} balance: ${hre.ethers.formatUnits(newBalance, decimals)}`);
    
  } catch (error) {
    console.error("❌ Failed to mint WBTC:", error.message);
    console.log("\nAlternative: You can get WBTC from other sources:");
    console.log("1. Aave UI: https://app.aave.com/faucet/");
    console.log("2. Sepolia faucets");
    console.log("3. Exchange or bridge from mainnet");
  }
}

// Run the script
if (require.main === module) {
  main()
    .then(() => {
      console.log("✅ WBTC token script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ WBTC token script failed:", error);
      process.exit(1);
    });
} 