// @ts-ignore
import YieldAggregatorAbi from "../abi/YieldAggregator.json" assert { type: "json" };
// @ts-ignore
import MockYieldStrategyAbi from "../abi/MockYieldStrategy.json" assert { type: "json" };
import { ethers } from "ethers";
import { 
  getYieldAggregatorAddress, 
  getMockERC20Address, 
  getMockYieldStrategyAddress 
} from "./addresses";

export const YIELD_AGGREGATOR_ABI = YieldAggregatorAbi.abi;
export const MOCK_YIELD_STRATEGY_ABI = MockYieldStrategyAbi.abi;

// Get contract addresses from addresses.json
export const getContractAddresses = (chainId: number) => {
  return {
    YieldAggregator: getYieldAggregatorAddress(chainId),
    MockERC20: getMockERC20Address(chainId),
    MockYieldStrategy: getMockYieldStrategyAddress(chainId),
  };
};

// Legacy CONTRACT_ADDRESSES for backward compatibility
export const CONTRACT_ADDRESSES: Record<number, Record<string, string>> = {
  31337: {
    YieldAggregator: getYieldAggregatorAddress(31337) || '',
    MockERC20: getMockERC20Address(31337) || '',
    MockYieldStrategy: getMockYieldStrategyAddress(31337) || '',
  },
  80002: {
    YieldAggregator: getYieldAggregatorAddress(80002) || '',
    MockERC20: getMockERC20Address(80002) || '',
    MockYieldStrategy: getMockYieldStrategyAddress(80002) || '',
  },
  11155111: {
    YieldAggregator: getYieldAggregatorAddress(11155111) || '',
    MockERC20: getMockERC20Address(11155111) || '',
    MockYieldStrategy: getMockYieldStrategyAddress(11155111) || '',
  },
};

export const STATIC_PROVIDERS: Record<number, ethers.JsonRpcProvider> = {
  31337: new ethers.JsonRpcProvider("http://127.0.0.1:8545"),
  11155111: new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://ethereum-sepolia.publicnode.com"),
  80002: new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology"),
}; 