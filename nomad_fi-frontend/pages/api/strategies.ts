import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import YIELD_AGGREGATOR_ABI_JSON from '../../src/abi/YieldAggregator.json';
import MOCK_YIELD_STRATEGY_ABI_JSON from '../../src/abi/MockYieldStrategy.json';
import AAVE_YIELD_STRATEGY_ABI_JSON from '../../src/abi/AAVEYieldStrategy.json';

const YIELD_AGGREGATOR_ABI = (YIELD_AGGREGATOR_ABI_JSON as any).abi || YIELD_AGGREGATOR_ABI_JSON;
const MOCK_YIELD_STRATEGY_ABI = (MOCK_YIELD_STRATEGY_ABI_JSON as any).abi || MOCK_YIELD_STRATEGY_ABI_JSON;
const AAVE_YIELD_STRATEGY_ABI = (AAVE_YIELD_STRATEGY_ABI_JSON as any).abi || AAVE_YIELD_STRATEGY_ABI_JSON;

const SEPOLIA_AGGREGATOR_ADDRESS = process.env.SEPOLIA_AGGREGATOR_ADDRESS || "0x6624E8D32CA3f4Ae85814496340B64Ac38E1799C";

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
].filter((c) => !!c.rpcUrl);

const PROVIDERS: Record<number, ethers.JsonRpcProvider> = {};
for (const chain of CHAIN_CONFIGS) {
  PROVIDERS[chain.chainId] = new ethers.JsonRpcProvider(chain.rpcUrl);
}

function serializeStrategyInfo(info: any) {
  if (!info || typeof info !== 'object') return info;
  return {
    tokenAddress: info.tokenAddress,
    strategyAddress: info.strategyAddress,
    name: info.name,
    chainId: typeof info.chainId === 'bigint' ? Number(info.chainId) : info.chainId,
    strategyType: typeof info.strategyType === 'bigint' ? Number(info.strategyType) : info.strategyType,
    isActive: info.isActive,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!SEPOLIA_AGGREGATOR_ADDRESS || !process.env.SEPOLIA_RPC_URL) {
    return res.status(500).json({ error: 'Missing SEPOLIA_AGGREGATOR_ADDRESS or SEPOLIA_RPC_URL in environment.' });
  }

  try {
    const sepoliaProvider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const aggregator = new ethers.Contract(SEPOLIA_AGGREGATOR_ADDRESS, YIELD_AGGREGATOR_ABI, sepoliaProvider);
    let allStrategies: any[] = [];
    let strategyIds: string[] = [];
    try {
      strategyIds = await aggregator.getAllStrategyIds();
    } catch (err) {
      console.error('[strategies API] Error fetching strategy IDs from Sepolia aggregator:', err);
      return res.status(500).json({ error: 'Failed to fetch strategy IDs from Sepolia aggregator.' });
    }
    for (const id of strategyIds) {
      try {
        // --- RATE LIMITING: Add 100ms delay between requests to avoid Infura rate limits ---
        await new Promise(resolve => setTimeout(resolve, 100));
        const info = await aggregator.getStrategyInfo(id);
        const strategy = serializeStrategyInfo(info);
        const chainId = strategy.chainId || 11155111;
        const provider = PROVIDERS[chainId] || sepoliaProvider;
        let chainName = CHAIN_CONFIGS.find((c) => c.chainId === chainId)?.name || `Chain ${chainId}`;
        let apy = null;
        let underlyingToken = null;
        let aToken = null;
        let currentBalance = null;
        if (provider && strategy.strategyAddress && strategy.strategyAddress.startsWith('0x') && strategy.strategyAddress.length === 42) {
          try {
            let strategyContract, apyRaw;
            if (typeof strategy.name === 'string' && strategy.name.toLowerCase().includes('aave')) {
              // Debug logs for APY fetch
              let providerUrl = (provider as any)?.connection?.url || (provider as any)?.connection || provider?.toString();
              console.log(`[strategies API][DEBUG] Provider URL:`, providerUrl);
              console.log(`[strategies API][DEBUG] Strategy address:`, strategy.strategyAddress);
              if (Array.isArray(AAVE_YIELD_STRATEGY_ABI)) {
                console.log(`[strategies API][DEBUG] ABI function names:`, AAVE_YIELD_STRATEGY_ABI.map((f: any) => f?.name).filter(Boolean));
              }
              strategyContract = new ethers.Contract(
                strategy.strategyAddress,
                AAVE_YIELD_STRATEGY_ABI,
                provider
              );
              try {
                apyRaw = await strategyContract.apy();
                apy = typeof apyRaw === 'bigint' ? apyRaw.toString() : apyRaw;
              } catch (apyCallErr) {
                console.error(`[strategies API][DEBUG] Error calling apy()`, apyCallErr);
                apy = null;
              }
              try { underlyingToken = await strategyContract.underlyingToken(); } catch (e) { console.error('[strategies API][DEBUG] Error fetching underlyingToken', e); }
              try { aToken = await strategyContract.aToken(); } catch (e) { console.error('[strategies API][DEBUG] Error fetching aToken', e); }
              try { const balRaw = await strategyContract.getCurrentBalance(); currentBalance = typeof balRaw === 'bigint' ? balRaw.toString() : balRaw; } catch (e) { console.error('[strategies API][DEBUG] Error fetching getCurrentBalance', e); }
            } else {
              strategyContract = new ethers.Contract(
                strategy.strategyAddress,
                MOCK_YIELD_STRATEGY_ABI,
                provider
              );
              apyRaw = await strategyContract.getAPY();
              apy = typeof apyRaw === 'bigint' ? apyRaw.toString() : apyRaw;
            }
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
          underlyingToken,
          aToken,
          currentBalance,
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