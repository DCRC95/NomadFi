require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    mumbai: {
      url: process.env.POLYGONSCAN_RPC_URL || "https://polygon-amoy.infura.io/v3/b3b18fff97b6463ca552f9334d7fe15f", // Polygon Amoy RPC URL
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80001,
    },
    sepolia: {
      url: process.env.ETHEREUM_SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/b3b18fff97b6463ca552f9334d7fe15f", // Ethereum Sepolia RPC URL
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
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
    apiKey: {
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "YOUR_POLYGONSCAN_API_KEY",
      sepolia: process.env.ETHERSCAN_API_KEY || "YOUR_ETHERSCAN_API_KEY",
    },
  },
};
