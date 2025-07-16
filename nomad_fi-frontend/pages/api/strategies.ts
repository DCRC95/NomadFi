import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import YIELD_AGGREGATOR_ABI_JSON from '../../src/abi/YieldAggregator.json';

// Use only the ABI array for ethers.Contract
const YIELD_AGGREGATOR_ABI = (YIELD_AGGREGATOR_ABI_JSON as any).abi || YIELD_AGGREGATOR_ABI_JSON;

// --- Chain Configurations ---
const CHAINS = [
  {
    name: 'Polygon Amoy',
    chainId: 80002,
    rpcUrl: process.env.NEXT_PUBLIC_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
    aggregatorAddress: '0xf8BCC457c406a30e00340f4b78436f21a57073BA',
    mockERC20Address: '0xd0B01c1ce87508757FEB41C5D8b2D117a4f4c283',
    mockYieldStrategyAddress: '0xEcC14061E9c3aa3cc1102d668c1b9e8c3da19392',
  },
  {
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com',
    aggregatorAddress: '', // No YieldAggregator on Sepolia
    mockERC20Address: '0x8b80b737c954d5fB43B390C083d72E210248ec64',
    mockYieldStrategyAddress: '0x2B3e7E84e4be132EB85c0180148c62fbDf6a7DCA',
  },
  // Hardhat removed for demo
];

// Helper to safely serialize BigInt values in strategy info
function serializeStrategyInfo(info: any) {
  if (!info || typeof info !== 'object') return info;
  // Explicitly map the expected fields from the YieldStrategy struct
  return {
    strategyAddress: info.strategyAddress,
    chainId: typeof info.chainId === 'bigint' ? Number(info.chainId) : info.chainId,
    name: info.name,
    description: info.description,
    baseRiskScore: typeof info.baseRiskScore === 'bigint' ? info.baseRiskScore.toString() : info.baseRiskScore,
    isActive: info.isActive,
    offchainMetadataURI: info.offchainMetadataURI,
  };
}

// --- API Handler ---
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    let allStrategies: any[] = [];

    for (const chain of CHAINS) {
      console.log(`[strategies API] Checking chain:`, chain);
      if (!chain.rpcUrl || !chain.aggregatorAddress || chain.aggregatorAddress.startsWith('0x') && chain.aggregatorAddress.length !== 42) {
        // Skip if not configured
        console.warn(`[strategies API] Skipping chain ${chain.name} due to missing RPC or aggregator address. rpcUrl: ${chain.rpcUrl}, aggregatorAddress: ${chain.aggregatorAddress}`);
        continue;
      }
      try {
        const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
        const aggregator = new ethers.Contract(chain.aggregatorAddress, YIELD_AGGREGATOR_ABI, provider);
        const strategyIds: string[] = await aggregator.getAllStrategyIds();
        const strategies = await Promise.all(
          strategyIds.map(async (id: string) => {
            try {
              const info = await aggregator.getStrategyInfo(id);
              console.log("DEBUG: API fetched info for", id, info);
              return {
                id: id.toString(),
                chainId: chain.chainId,
                ...serializeStrategyInfo(info),
              };
            } catch (err) {
              console.error(`[strategies API] Error fetching strategy info for id ${id} on ${chain.name}:`, err);
              return null;
            }
          })
        );
        allStrategies = allStrategies.concat(strategies.filter(Boolean));
      } catch (err) {
        console.error(`[strategies API] Error fetching from ${chain.name}:`, err);
        // For MVP, just skip this chain if error
      }
    }

    res.status(200).json(allStrategies);
  } catch (error) {
    console.error('[strategies API] Unexpected error:', error);
    res.status(500).json({ error: 'Failed to fetch strategies from all chains.' });
  }
}

// ---
// Notes:
// - Update aggregatorAddress for Sepolia and Amoy after deployment (Week 4, Phase 1).
// - Set SEPOLIA_RPC_URL and AMOY_RPC_URL in your .env.local for public testnets.
// - This endpoint is the single source of truth for all strategies in the frontend. 