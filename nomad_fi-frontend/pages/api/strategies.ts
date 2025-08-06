import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import YIELD_AGGREGATOR_ABI_JSON from '../../src/abi/YieldAggregator.json';
import { getYieldAggregatorAddress } from '../../src/lib/addresses';

const YIELD_AGGREGATOR_ABI = (YIELD_AGGREGATOR_ABI_JSON as any).abi || YIELD_AGGREGATOR_ABI_JSON;

const CHAIN_CONFIGS = [
  {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    rpcUrl: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia.publicnode.com",
    aggregatorAddress: getYieldAggregatorAddress(11155111),
  },
  // Note: Hardhat Network (31337) is skipped when not running locally
  // Note: Amoy (80002) has OLD_YieldAggregator, not the new one
].filter((c) => !!c.rpcUrl && !!c.aggregatorAddress);

const PROVIDERS: Record<number, ethers.JsonRpcProvider> = {};
for (const chain of CHAIN_CONFIGS) {
  try {
    const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
    PROVIDERS[chain.chainId] = provider;
  } catch (error) {
    console.error(`Failed to create provider for ${chain.name}:`, error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { walletAddress } = req.query; // Get wallet address from query params
  
  let allStrategies: any[] = [];

  // Try to fetch strategies from each chain
  for (let i = 0; i < CHAIN_CONFIGS.length; i++) {
    const chain = CHAIN_CONFIGS[i];
    
    // Add delay between chains to avoid rate limiting
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }
    
    try {
      const provider = PROVIDERS[chain.chainId];
      const aggregator = new ethers.Contract(chain.aggregatorAddress!, YIELD_AGGREGATOR_ABI, provider);
      
      // Add delay before RPC call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let strategyIds: string[] = [];
      try {
        strategyIds = await aggregator.getAllStrategyIds();
        console.log(`[strategies API] Found ${strategyIds.length} strategies on ${chain.name}`);
      } catch (err) {
        console.log(`[strategies API] No strategies found on ${chain.name}`);
        continue; // Skip to next chain if no strategies found
      }
  
      // Get batch strategy data for all strategies at once
      try {
        console.log(`[strategies API] Getting batch strategy data for ${strategyIds.length} strategies on ${chain.name}`);
        const strategyDataArray = await aggregator.getBatchStrategyData(strategyIds);
        
        // Process each strategy
        for (let j = 0; j < strategyDataArray.length; j++) {
          const strategyData = strategyDataArray[j];
          const strategyId = strategyIds[j];
          
          // Get user data if wallet address is provided
          let userData = null;
          if (walletAddress && typeof walletAddress === 'string') {
            try {
              userData = await aggregator.getUserData(walletAddress, strategyId);
            } catch (userDataErr) {
              console.error(`[strategies API] Error getting user data for strategy ${strategyId}:`, userDataErr);
            }
          }
          
          // Get additional strategy info
          let strategyInfo = null;
          try {
            strategyInfo = await aggregator.getStrategyInfo(strategyId);
          } catch (strategyInfoErr) {
            console.error(`[strategies API] Error getting strategy info for ${strategyId}:`, strategyInfoErr);
          }
          
                     // Helper function to safely convert BigInt to string
           const safeToString = (value: any): string => {
             if (typeof value === 'bigint') return value.toString();
             if (value === null || value === undefined) return "0";
             return value.toString();
           };

           // Build strategy object
           const strategy = {
             id: strategyId.toString(),
             chainId: chain.chainId,
             chainName: chain.name,
             name: strategyData.name || strategyInfo?.name || `Strategy ${strategyId}`,
             description: `${strategyData.name || 'Strategy'} on ${chain.name}`,
             tokenAddress: strategyData.tokenAddress,
             strategyAddress: strategyData.strategyAddress,
             address: strategyData.strategyAddress, // For compatibility
             strategyType: Number(strategyData.strategyType),
             isActive: strategyData.isActive,
             apy: strategyData.apy ? safeToString(strategyData.apy) : null,
             tvl: safeToString(strategyData.totalValueLocked),
             totalDeposits: safeToString(strategyData.totalDeposits),
             // User-specific data
             currentBalance: userData ? safeToString(userData.balance) : "0",
             walletBalance: userData ? safeToString(userData.balance) : null,
             depositedAmount: userData ? safeToString(userData.depositedAmount) : "0",
             allowance: userData ? safeToString(userData.allowance) : "0",
             needsApproval: userData ? userData.needsApproval : false,
             // Additional data from strategy info
             underlyingToken: strategyData.tokenAddress,
             aToken: null, // This would need to be fetched from individual strategy contracts if needed
           };
          
          allStrategies.push(strategy);
        }
        
        console.log(`[strategies API] Successfully processed ${strategyDataArray.length} strategies from ${chain.name}`);
        
      } catch (batchDataErr) {
        console.error(`[strategies API] Error getting batch strategy data on ${chain.name}:`, batchDataErr);
        
        // Fallback: get data individually
        console.log(`[strategies API] Falling back to individual strategy data fetching on ${chain.name}`);
        
        for (let j = 0; j < strategyIds.length; j++) {
          const strategyId = strategyIds[j];
          
          try {
            // Add delay between requests to avoid rate limiting
            if (j > 0) {
              await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay between strategies
            }
            
            // Get strategy info
            const strategyInfo = await aggregator.getStrategyInfo(strategyId);
            
            // Get APY
            let apy = null;
            try {
              const apyValue = await aggregator.getStrategyAPY(strategyId);
              apy = apyValue.toString();
            } catch (apyErr) {
              console.error(`[strategies API] Error getting APY for strategy ${strategyId}:`, apyErr);
            }
            

            
            // Get user data if wallet address is provided
            let userData = null;
            if (walletAddress && typeof walletAddress === 'string') {
              try {
                userData = await aggregator.getUserData(walletAddress, strategyId);
              } catch (userDataErr) {
                console.error(`[strategies API] Error getting user data for strategy ${strategyId}:`, userDataErr);
              }
            }
            
                         // Helper function to safely convert BigInt to string
             const safeToString = (value: any): string => {
               if (typeof value === 'bigint') return value.toString();
               if (value === null || value === undefined) return "0";
               return value.toString();
             };

             // Build strategy object
             const strategy = {
               id: strategyId.toString(),
               chainId: chain.chainId,
               chainName: chain.name,
               name: strategyInfo.name || `Strategy ${strategyId}`,
               description: `${strategyInfo.name || 'Strategy'} on ${chain.name}`,
               tokenAddress: strategyInfo.tokenAddress,
               strategyAddress: strategyInfo.strategyAddress,
               address: strategyInfo.strategyAddress, // For compatibility
               strategyType: Number(strategyInfo.strategyType),
               isActive: strategyInfo.isActive,
               apy: apy,
               tvl: "0", // Would need to be calculated from deposits
               totalDeposits: "0", // Would need to be calculated
               // User-specific data
               currentBalance: userData ? safeToString(userData.balance) : "0",
               walletBalance: userData ? safeToString(userData.balance) : null,
               depositedAmount: userData ? safeToString(userData.depositedAmount) : "0",
               allowance: userData ? safeToString(userData.allowance) : "0",
               needsApproval: userData ? userData.needsApproval : false,
               // Additional data
               underlyingToken: strategyInfo.tokenAddress,
               aToken: null, // This would need to be fetched from individual strategy contracts if needed
             };
            
            allStrategies.push(strategy);
            
          } catch (strategyErr) {
            console.error(`[strategies API] Error processing strategy ${strategyId} on ${chain.name}:`, strategyErr);
          }
        }
      }
      
    } catch (error) {
      console.error(`[strategies API] Error connecting to ${chain.name}:`, error);
    }
  }

  // If no strategies found from any chain, return empty array
  if (allStrategies.length === 0) {
    console.log('[strategies API] No strategies found from any chain');
  }
  
  res.status(200).json(allStrategies);
} 