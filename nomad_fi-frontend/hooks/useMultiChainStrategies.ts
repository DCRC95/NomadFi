// hooks/useMultiChainStrategies.ts
// Custom hook for fetching strategies from all active chains
// Uses batch functions to minimize RPC calls

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CHAIN_CONFIGS, getActiveChainIds } from '../lib/chainConfig';
import { rpcCallWithRetry, delay } from '../lib/rpcUtils';
import YieldAggregatorABI from '../src/abi/YieldAggregator.json';

export interface StrategyInfo {
  id: number;
  chainId: string;
  chainName: string;
  name: string;
  tokenAddress: string;
  strategyAddress: string;
  apy: string;
  isActive: boolean;
  totalDeposits?: string;
  userDeposits?: string;
}

export interface MultiChainStrategiesState {
  strategies: StrategyInfo[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const useMultiChainStrategies = () => {
  const [state, setState] = useState<MultiChainStrategiesState>({
    strategies: [],
    loading: false,
    error: null,
    lastUpdated: null
  });

  // Cache to prevent duplicate calls
  const [isFetching, setIsFetching] = useState(false);
  const [cacheTimeout, setCacheTimeout] = useState<NodeJS.Timeout | null>(null);

  const fetchStrategies = async () => {
    // Prevent duplicate calls
    if (isFetching) {
      console.log('Strategy fetch already in progress, skipping...');
      return;
    }

    // Check if we have recent data (cache for 30 seconds)
    const now = new Date();
    if (state.lastUpdated && (now.getTime() - state.lastUpdated.getTime()) < 30000) {
      console.log('Using cached strategy data...');
      return;
    }

    setIsFetching(true);
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const allStrategies: StrategyInfo[] = [];
      const activeChainIds = getActiveChainIds();

      // Fetch from all active chains with delays to avoid rate limiting
      const chainPromises = activeChainIds.map(async (chainId, index) => {
        const chainConfig = CHAIN_CONFIGS.find(chain => chain.id === chainId);
        if (!chainConfig) return [];

        // Add delay between requests to avoid rate limiting
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * index)); // 1 second delay per chain
        }

        try {
          console.log(`Fetching strategies from ${chainConfig.name} (${chainId})`);
          console.log(`Using RPC URL: ${chainConfig.rpcUrl}`);
          
          const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
          const aggregator = new ethers.Contract(
            chainConfig.aggregatorAddress,
            YieldAggregatorABI.abi,
            provider
          );

          // Add delay before making RPC calls
          await delay(500);

          // Get all strategy IDs first with proper retry logic
          console.log(`Calling getAllStrategyIds on ${chainConfig.name}...`);
          const strategyIds = await rpcCallWithRetry(
            () => aggregator.getAllStrategyIds(),
            { maxRetries: 3, retryDelay: 1000, timeout: 15000 }
          );
          console.log(`Found ${strategyIds.length} strategies on ${chainConfig.name}`);

          if (strategyIds.length === 0) {
            console.log(`No strategies found on ${chainConfig.name}, returning empty array`);
            return [];
          }

          // Add delay before batch call
          await delay(300);

          // Get all strategies in one batch call with proper retry logic
          console.log(`Calling getBatchStrategyData on ${chainConfig.name} with ${strategyIds.length} strategies...`);
          const batchData = await rpcCallWithRetry(
            () => aggregator.getBatchStrategyData([...strategyIds]),
            { maxRetries: 3, retryDelay: 1000, timeout: 15000 }
          );
          
          // Map strategy data to our format
          const strategiesWithAPY = batchData.map((strategy: any, index: number) => {
            return {
              id: strategyIds[index], // Use the actual strategy ID
              chainId: chainId,
              chainName: chainConfig.name,
              name: strategy.name,
              tokenAddress: strategy.tokenAddress,
              strategyAddress: strategy.strategyAddress,
              apy: strategy.apy?.toString() || "0",
              isActive: strategy.isActive,
              totalDeposits: strategy.totalDeposits?.toString(),
              totalValueLocked: strategy.totalValueLocked?.toString()
            };
          });

          return strategiesWithAPY;
        } catch (error) {
          console.error(`Failed to fetch from ${chainConfig.name}:`, error);
          
          // Check if it's a "Failed to fetch" error
          if (error instanceof Error && error.message.includes('Failed to fetch')) {
            console.log(`RPC connection failed for ${chainConfig.name}, skipping...`);
          }
          
          return []; // Return empty array if chain fails
        }
      });

      // Wait for all chains to respond
      const results = await Promise.all(chainPromises);
      
      // Combine all results
      results.forEach(chainStrategies => {
        allStrategies.push(...chainStrategies);
      });

      setState({
        strategies: allStrategies,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });

      console.log(`Successfully fetched ${allStrategies.length} strategies from ${activeChainIds.length} chains`);

    } catch (error) {
      console.error('Failed to fetch strategies:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch strategies'
      }));
    } finally {
      setIsFetching(false);
    }
  };

  const refetch = () => {
    fetchStrategies();
  };

  // Fetch on mount
  useEffect(() => {
    fetchStrategies();
  }, []);

  return {
    ...state,
    refetch
  };
}; 