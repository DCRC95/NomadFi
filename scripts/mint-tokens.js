// scripts/mint-tokens.js
// Mint some MockERC20 tokens for testing

const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Minting tokens with account: ${deployer.address}`);
  console.log(`Network: ${hre.network.name}`);

  // Contract addresses
  const MOCK_ERC20_ADDRESS = "0xd0B01c1ce87508757FEB41C5D8b2D117a4f4c283";
  
  // Get MockERC20 contract
  const MockERC20 = await ethers.getContractAt("MockERC20", MOCK_ERC20_ADDRESS);
  
  // Check current balance
  const currentBalance = await MockERC20.balanceOf(deployer.address);
  console.log(`Current balance: ${ethers.formatUnits(currentBalance, 18)} tokens`);
  
  // Mint some tokens (1000 tokens)
  const mintAmount = ethers.parseUnits("1000", 18);
  console.log(`Minting ${ethers.formatUnits(mintAmount, 18)} tokens...`);
  
  try {
    const tx = await MockERC20.mint(deployer.address, mintAmount);
    await tx.wait();
    console.log("✅ Tokens minted successfully!");
    
    // Check new balance
    const newBalance = await MockERC20.balanceOf(deployer.address);
    console.log(`New balance: ${ethers.formatUnits(newBalance, 18)} tokens`);
  } catch (error) {
    console.error("❌ Error minting tokens:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 