import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import addresses from '../../constants/addresses.json';

interface UseAaveAPYForTokenReturn {
  apy: number | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Minimal ABI for Aave V3 UI Pool Data Provider
const UI_POOL_DATA_PROVIDER_ABI = [
  "function getReservesData(address provider) view returns (tuple(address underlyingAsset, string name, string symbol, uint256 decimals, uint256 baseLTVasCollateral, uint256 reserveLiquidationThreshold, uint256 reserveLiquidationBonus, uint256 reserveFactor, bool usageAsCollateralEnabled, bool borrowingEnabled, bool stableBorrowRateEnabled, bool isActive, bool isFrozen, uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 currentLiquidityRate, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint256 availableLiquidity, uint256 totalPrincipalStableDebt, uint256 averageStableRate, uint256 stableDebtLastUpdateTimestamp, uint256 totalScaledVariableDebt, uint256 priceInMarketReferenceCurrency, uint256 priceOracle, uint256 variableRateSlope1, uint256 variableRateSlope2, uint256 stableRateSlope1, uint256 stableRateSlope2, uint256 baseStableBorrowRate, uint256 baseVariableBorrowRate, uint256 optimalUsageRatio)[] reservesData, uint256 marketReferenceCurrencyUnit, int256 marketReferenceCurrencyPriceInUsd, uint8 networkBaseTokenPriceDecimals, uint8 marketReferenceCurrencyDecimals)"
];

export const useAaveAPYForToken = (chainId: string, tokenAddress: string, strategyName?: string): UseAaveAPYForTokenReturn => {
  const [apy, setApy] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAPY = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[useAaveAPYForToken] Starting fetch for ${strategyName} (${tokenAddress})`);

      const chainAddresses = addresses[chainId as keyof typeof addresses] as any;
      if (!chainAddresses?.aaveV3?.core) {
        throw new Error(`No Aave V3 configuration found for chain ${chainId}`);
      }

      const { UI_POOL_DATA_PROVIDER, POOL_ADDRESSES_PROVIDER } = chainAddresses.aaveV3.core;
      if (!UI_POOL_DATA_PROVIDER || !POOL_ADDRESSES_PROVIDER) {
        throw new Error(`Missing UI Pool Data Provider addresses for chain ${chainId}`);
      }

      // Determine the correct Aave asset address based on strategy name and type
      let aaveAssetAddress = tokenAddress;
      if (chainAddresses.aaveV3?.assets && strategyName) {
        const strategyNameLower = strategyName.toLowerCase();
        
        console.log(`[useAaveAPYForToken] Strategy name: ${strategyName}, lowercase: ${strategyNameLower}`);
        
        // Map strategy names to their correct Aave asset addresses
        if (strategyNameLower.includes('aavev3link') || strategyNameLower.includes('link')) {
          if (chainAddresses.aaveV3.assets.LINK) {
            aaveAssetAddress = chainAddresses.aaveV3.assets.LINK.UNDERLYING;
            console.log(`[useAaveAPYForToken] Mapped to LINK: ${aaveAssetAddress}`);
          } else {
            console.warn(`[useAaveAPYForToken] LINK asset not available on chain ${chainId}, using original address`);
          }
        } else if (strategyNameLower.includes('aavev3wbtc') || strategyNameLower.includes('wbtc')) {
          if (chainAddresses.aaveV3.assets.WBTC) {
            aaveAssetAddress = chainAddresses.aaveV3.assets.WBTC.UNDERLYING;
            console.log(`[useAaveAPYForToken] Mapped to WBTC: ${aaveAssetAddress}`);
          } else {
            console.warn(`[useAaveAPYForToken] WBTC asset not available on chain ${chainId}, using original address`);
          }
        } else if (strategyNameLower.includes('aavev3eurs') || strategyNameLower.includes('eurs')) {
          if (chainAddresses.aaveV3.assets.EURS) {
            aaveAssetAddress = chainAddresses.aaveV3.assets.EURS.UNDERLYING;
            console.log(`[useAaveAPYForToken] Mapped to EURS: ${aaveAssetAddress}`);
          } else {
            console.warn(`[useAaveAPYForToken] EURS asset not available on chain ${chainId}, using original address`);
          }
        } else if (strategyNameLower.includes('aavev3aave') || strategyNameLower.includes('aave')) {
          // Check if AAVE asset exists for this chain
          if (chainAddresses.aaveV3.assets.AAVE) {
            aaveAssetAddress = chainAddresses.aaveV3.assets.AAVE.UNDERLYING;
            console.log(`[useAaveAPYForToken] Mapped to AAVE: ${aaveAssetAddress}`);
          } else {
            console.warn(`[useAaveAPYForToken] AAVE asset not available on chain ${chainId}, using original address`);
          }
        } else if (strategyNameLower.includes('aavev3usdc') || strategyNameLower.includes('usdc')) {
          if (chainAddresses.aaveV3.assets.USDC) {
            aaveAssetAddress = chainAddresses.aaveV3.assets.USDC.UNDERLYING;
            console.log(`[useAaveAPYForToken] Mapped to USDC: ${aaveAssetAddress}`);
          } else {
            console.warn(`[useAaveAPYForToken] USDC asset not available on chain ${chainId}, using original address`);
          }
        } else if (strategyNameLower.includes('aavev3dai') || strategyNameLower.includes('dai')) {
          if (chainAddresses.aaveV3.assets.DAI) {
            aaveAssetAddress = chainAddresses.aaveV3.assets.DAI.UNDERLYING;
            console.log(`[useAaveAPYForToken] Mapped to DAI: ${aaveAssetAddress}`);
          } else {
            console.warn(`[useAaveAPYForToken] DAI asset not available on chain ${chainId}, using original address`);
          }
        } else if (strategyNameLower.includes('aavev3weth') || strategyNameLower.includes('weth')) {
          if (chainAddresses.aaveV3.assets.WETH) {
            aaveAssetAddress = chainAddresses.aaveV3.assets.WETH.UNDERLYING;
            console.log(`[useAaveAPYForToken] Mapped to WETH: ${aaveAssetAddress}`);
          } else {
            console.warn(`[useAaveAPYForToken] WETH asset not available on chain ${chainId}, using original address`);
          }
        } else if (strategyNameLower.includes('aavev3usdt') || strategyNameLower.includes('usdt')) {
          if (chainAddresses.aaveV3.assets.USDT) {
            aaveAssetAddress = chainAddresses.aaveV3.assets.USDT.UNDERLYING;
            console.log(`[useAaveAPYForToken] Mapped to USDT: ${aaveAssetAddress}`);
          } else {
            console.warn(`[useAaveAPYForToken] USDT asset not available on chain ${chainId}, using original address`);
          }
        } else if (strategyNameLower.includes('aavev3cbeth') || strategyNameLower.includes('cbeth')) {
          if (chainAddresses.aaveV3.assets.cbETH) {
            aaveAssetAddress = chainAddresses.aaveV3.assets.cbETH.UNDERLYING;
            console.log(`[useAaveAPYForToken] Mapped to cbETH: ${aaveAssetAddress}`);
          } else {
            console.warn(`[useAaveAPYForToken] cbETH asset not available on chain ${chainId}, using original address`);
          }
        } else {
          console.log(`[useAaveAPYForToken] No mapping found, using original: ${aaveAssetAddress}`);
        }
      }
      

      // Create provider with support for Base Sepolia
      let rpcUrl: string;
      switch (chainId) {
        case '11155111': // Sepolia
          rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com';
          break;
        case '84532': // Base Sepolia
          rpcUrl = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
          break;
        case '1': // Ethereum mainnet
          rpcUrl = 'https://ethereum.publicnode.com';
          break;
        default: // Default to Polygon
          rpcUrl = 'https://polygon.publicnode.com';
          break;
      }
      
      console.log(`[useAaveAPYForToken] Using RPC URL: ${rpcUrl}`);
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const poolDataProvider = new ethers.Contract(UI_POOL_DATA_PROVIDER, UI_POOL_DATA_PROVIDER_ABI, provider);

      // Fetch all reserves data
      const reservesResult = await poolDataProvider.getReservesData(POOL_ADDRESSES_PROVIDER);
      const reserves = reservesResult.reservesData;

      // Find the reserve for this specific token
      const reserve = reserves.find((r: any) => 
        r.underlyingAsset.toLowerCase() === aaveAssetAddress.toLowerCase()
      );

      if (!reserve) {
        console.warn(`Token ${aaveAssetAddress} not found in Aave reserves. Available tokens:`, 
          reserves.map((r: any) => `${r.symbol} (${r.underlyingAsset})`));
        throw new Error(`Token ${aaveAssetAddress} not found in Aave reserves`);
      }

      // Calculate APY
      const liquidityRateRay = reserve.currentLiquidityRate;
      const supplyAPR = Number(ethers.formatUnits(liquidityRateRay, 27));
      const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
      const supplyAPY = (Math.pow(1 + supplyAPR / SECONDS_PER_YEAR, SECONDS_PER_YEAR) - 1) * 100;

      console.log(`[useAaveAPYForToken] Calculated APY: ${supplyAPY.toFixed(4)}%`);
      setApy(supplyAPY);
    } catch (err) {
      console.error('[useAaveAPYForToken] Error fetching Aave APY for token:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch APY data');
      setApy(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chainId && tokenAddress) {
      fetchAPY();
    }
  }, [chainId, tokenAddress, strategyName]);

  return {
    apy,
    loading,
    error,
    refetch: fetchAPY
  };
}; 