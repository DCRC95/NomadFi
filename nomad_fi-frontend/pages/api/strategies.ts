import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import YIELD_AGGREGATOR_ABI_JSON from '../../src/abi/YieldAggregator.json';
import MOCK_YIELD_STRATEGY_ABI_JSON from '../../src/abi/MockYieldStrategy.json';

const YIELD_AGGREGATOR_ABI = (YIELD_AGGREGATOR_ABI_JSON as any).abi || YIELD_AGGREGATOR_ABI_JSON;
const MOCK_YIELD_STRATEGY_ABI = (MOCK_YIELD_STRATEGY_ABI_JSON as any).abi || MOCK_YIELD_STRATEGY_ABI_JSON;

// --- Chain Configurations ---
const CHAIN_CONFIGS = [
  {
    chainId: 80002,
    name: 'Polygon Amoy',
    rpcUrl: process.env.AMOY_RPC_URL,
  },
  {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    rpcUrl: process.env.SEPOLIA_RPC_URL,
  },
  // Add more chains here as needed
].filter((c) => !!c.rpcUrl);

const PROVIDERS: Record<number, ethers.JsonRpcProvider> = {};
for (const chain of CHAIN_CONFIGS) {
  PROVIDERS[chain.chainId] = new ethers.JsonRpcProvider(chain.rpcUrl);
}

const AMOY_AGGREGATOR_ADDRESS = process.env.AMOY_AGGREGATOR_ADDRESS;

function serializeStrategyInfo(info: any) {
  if (!info || typeof info !== 'object') return info;
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!AMOY_AGGREGATOR_ADDRESS || !process.env.AMOY_RPC_URL) {
    return res.status(500).json({ error: 'Missing AMOY_AGGREGATOR_ADDRESS or AMOY_RPC_URL in environment.' });
  }

  try {
    const amoyProvider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL);
    const aggregator = new ethers.Contract(AMOY_AGGREGATOR_ADDRESS, YIELD_AGGREGATOR_ABI, amoyProvider);
    let allStrategies: any[] = [];
    let strategyIds: string[] = [];
    try {
      strategyIds = await aggregator.getAllStrategyIds();
    } catch (err) {
      console.error('[strategies API] Error fetching strategy IDs from Amoy aggregator:', err);
      return res.status(500).json({ error: 'Failed to fetch strategy IDs from Amoy aggregator.' });
    }

    for (const id of strategyIds) {
      try {
        const info = await aggregator.getStrategyInfo(id);
        const strategy = serializeStrategyInfo(info);
        const chainId = strategy.chainId;
        const provider = PROVIDERS[chainId];
        let apy = null;
        let chainName = CHAIN_CONFIGS.find((c) => c.chainId === chainId)?.name || `Chain ${chainId}`;
        if (provider && strategy.strategyAddress && strategy.strategyAddress.startsWith('0x') && strategy.strategyAddress.length === 42) {
          try {
            const strategyContract = new ethers.Contract(
              strategy.strategyAddress,
              MOCK_YIELD_STRATEGY_ABI,
              provider
            );
            const apyRaw = await strategyContract.getAPY();
            apy = typeof apyRaw === 'bigint' ? apyRaw.toString() : apyRaw;
          } catch (apyErr) {
            console.error(`[strategies API] Error fetching APY for strategy ${id} on ${chainName}:`, apyErr);
            apy = null;
          }
        } else {
          console.warn(`[strategies API] No provider or invalid address for strategy ${id} on ${chainName}`);
        }
        allStrategies.push({
          id: id.toString(),
          chainId,
          chainName,
          apy,
          ...strategy,
        });
      } catch (err) {
        console.error(`[strategies API] Error fetching strategy info for id ${id}:`, err);
      }
    }

    res.status(200).json(allStrategies);
  } catch (error) {
    console.error('[strategies API] Unexpected error:', error);
    res.status(500).json({ error: 'Failed to fetch strategies.' });
  }
}
// ---
// Notes:
// - Only Amoy aggregator is used as the source of truth for strategies.
// - APY is fetched from the correct chain for each strategy.
// - Add more chains to CHAIN_CONFIGS as needed. 