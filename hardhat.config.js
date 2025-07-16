require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require('@nomicfoundation/hardhat-ethers');

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      chainId: 11155111,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      // gasPrice: 1000000000, // Optional: specify if needed
    },
    amoy: {
      url: process.env.AMOY_RPC_URL,
      chainId: 80002, // Amoy testnet chainId
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      // gasPrice: 1000000000, // Optional: specify if needed
    },
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  etherscan: {
    apiKey: 
      process.env.ETHERSCAN_API_KEY,  
    
  },
};

// Notes:
// - Set your PRIVATE_KEY, AMOY_RPC_URL, SEPOLIA_RPC_URL, POLYGONSCAN_API_KEY, and ETHERSCAN_API_KEY in a .env file (never commit secrets).
// - Use secure providers like Alchemy or Infura for RPC URLs.
// - Never commit your private key or sensitive data to version control.
