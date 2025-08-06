// lib/chainConfig.ts
// Chain configuration that reads from addresses.json
// This file should NEVER modify addresses.json, only read from it

import addresses from '../../constants/addresses.json';

export interface ChainConfig {
  id: string;
  name: string;
  rpcUrl: string;
  aggregatorAddress: string;
  networkName: string;
  isActive: boolean; // Whether this chain has a working YieldAggregator
}

export const CHAIN_CONFIGS: ChainConfig[] = [
  {
    id: "31337",
    name: "Hardhat Network",
    rpcUrl: "http://127.0.0.1:8545",
    aggregatorAddress: addresses["31337"].deployedContracts.YieldAggregator,
    networkName: addresses["31337"].networkName,
    isActive: true // Will be dynamically disabled if connection fails
  },
  {
    id: "11155111", 
    name: "Sepolia",
    rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/b3b18fff97b6463ca552f9334d7fe15f",
    aggregatorAddress: addresses["11155111"].yieldAggregator, // Use the correct address with TVL data
    networkName: addresses["11155111"].networkName,
    isActive: true // Now active with new YieldAggregator contract
  },
  {
    id: "84532",
    name: "Base Sepolia",
    rpcUrl: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
    aggregatorAddress: addresses["84532"].deployedContracts.YieldAggregator,
    networkName: addresses["84532"].networkName,
    isActive: true // Active with deployed YieldAggregator
  },
  {
    id: "80002",
    name: "Polygon Amoy", 
    rpcUrl: process.env.NEXT_PUBLIC_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
    // NOTE: Polygon Amoy currently has OLD_YieldAggregator - needs user decision
    aggregatorAddress: addresses["80002"].deployedContracts.OLD_YieldAggregator,
    networkName: addresses["80002"].networkName,
    isActive: false // Set to false until new YieldAggregator is deployed
  }
];

// Helper function to get chain config by ID
export const getChainConfig = (chainId: string): ChainConfig | undefined => {
  return CHAIN_CONFIGS.find(chain => chain.id === chainId);
};

// Helper function to get all active chain IDs
export const getActiveChainIds = (): string[] => {
  return CHAIN_CONFIGS.filter(chain => chain.isActive).map(chain => chain.id);
};

// Helper function to get all chain IDs
export const getAllChainIds = (): string[] => {
  return CHAIN_CONFIGS.map(chain => chain.id);
}; 