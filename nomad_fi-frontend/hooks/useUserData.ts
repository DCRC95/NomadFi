// hooks/useUserData.ts
// Custom hook for fetching user data for all strategies in one batch call

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount, useChainId } from 'wagmi';
import { CHAIN_CONFIGS } from '../lib/chainConfig';
import { rpcCallWithRetry, delay } from '../lib/rpcUtils';
import YieldAggregatorABI from '../src/abi/YieldAggregator.json';

export interface UserData {
  balance: string;
  allowance: string;
  depositedAmount: string;
  needsApproval: boolean;
}

export interface UserDataState {
  userData: { [strategyId: number]: UserData };
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const useUserData = (strategyIds: number[]) => {
  const [state, setState] = useState<UserDataState>({
    userData: {},
    loading: false,
    error: null,
    lastUpdated: null
  });

  const { address: userAddress } = useAccount();
  const chainId = useChainId();

  const fetchUserData = async () => {
    if (!userAddress || strategyIds.length === 0) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const chainConfig = CHAIN_CONFIGS.find(chain => chain.id === chainId.toString());
      if (!chainConfig) {
        throw new Error('Chain not found');
      }

      console.log(`Fetching user data for ${strategyIds.length} strategies on ${chainConfig.name}...`);
      console.log(`Using RPC URL: ${chainConfig.rpcUrl}`);
      
      const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
      const aggregator = new ethers.Contract(
        chainConfig.aggregatorAddress,
        YieldAggregatorABI.abi,
        provider
      );

      // Get all user data in one batch call with proper retry logic
      console.log(`Calling getBatchUserData for user ${userAddress}...`);
      
      const batchUserData = await rpcCallWithRetry(
        () => aggregator.getBatchUserData(userAddress, strategyIds),
        { maxRetries: 3, retryDelay: 1000, timeout: 15000 }
      );
      
      // Map the data
      const userDataMap: { [strategyId: number]: UserData } = {};
      strategyIds.forEach((strategyId, index) => {
        const data = batchUserData[index];
        userDataMap[strategyId] = {
          balance: data.balance?.toString() || "0",
          allowance: data.allowance?.toString() || "0",
          depositedAmount: data.depositedAmount?.toString() || "0",
          needsApproval: data.needsApproval || false
        };
      });

      setState({
        userData: userDataMap,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });

      console.log(`Successfully fetched user data for ${strategyIds.length} strategies`);

    } catch (error) {
      console.error('Failed to fetch user data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user data'
      }));
    }
  };

  const refetch = () => {
    fetchUserData();
  };

  // Fetch when user address, chain, or strategy IDs change
  useEffect(() => {
    fetchUserData();
  }, [userAddress, chainId, strategyIds.join(',')]);

  return {
    ...state,
    refetch
  };
}; 