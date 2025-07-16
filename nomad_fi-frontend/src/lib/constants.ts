// @ts-ignore
import YieldAggregatorAbi from "../abi/YieldAggregator.json" assert { type: "json" };
// @ts-ignore
import MockYieldStrategyAbi from "../abi/MockYieldStrategy.json" assert { type: "json" };
import { ethers } from "ethers";

export const YIELD_AGGREGATOR_ABI = YieldAggregatorAbi.abi;
export const MOCK_YIELD_STRATEGY_ABI = MockYieldStrategyAbi.abi;

// Replace these with your actual deployed contract addresses
export const CONTRACT_ADDRESSES: Record<number, Record<string, string>> = {
  80002: {
    YieldAggregator: '0xf8BCC457c406a30e00340f4b78436f21a57073BA',
    MockERC20: '0xd0B01c1ce87508757FEB41C5D8b2D117a4f4c283',
    MockYieldStrategy: '0xEcC14061E9c3aa3cc1102d668c1b9e8c3da19392',
  },
  11155111: {
    YieldAggregator: '', // No aggregator on Sepolia
    MockERC20: '0x8b80b737c954d5fB43B390C083d72E210248ec64',
    MockYieldStrategy: '0x2B3e7E84e4be132EB85c0180148c62fbDf6a7DCA',
  },
  // 31337: { ... } // Hardhat removed for demo
};

export const STATIC_PROVIDERS: Record<number, ethers.JsonRpcProvider> = {
  31337: new ethers.JsonRpcProvider("http://127.0.0.1:8545"),
  11155111: new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://ethereum-sepolia.publicnode.com"),
  80002: new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology"),
}; 