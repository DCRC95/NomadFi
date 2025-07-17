require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require('@nomicfoundation/hardhat-ethers');
require("@nomicfoundation/hardhat-verify");
require("hardhat-deploy");

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      chainId: 11155111,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    amoy: {
      url: process.env.AMOY_RPC_URL,
      chainId: 80002,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
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
  paths: {
    artifacts: "./artifacts",
    deploy: "./deploy",
    deployments: "./deployments",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};