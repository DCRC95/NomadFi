import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import addresses from '../../constants/addresses.json';

interface AaveAssetAPY {
  symbol: string;
  underlyingAddress: string;
  supplyAPY: number;
  supplyAPR: number;
  availableLiquidity: string;
  decimals: number;
  chainId: string;
}

interface UseAaveAPYReturn {
  apyData: AaveAssetAPY[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Minimal ABI for Aave V3 UI Pool Data Provider
const UI_POOL_DATA_PROVIDER_ABI = [
  "function getReservesData(address provider) view returns (tuple(address underlyingAsset, string name, string symbol, uint256 decimals, uint256 baseLTVasCollateral, uint256 reserveLiquidationThreshold, uint256 reserveLiquidationBonus, uint256 reserveFactor, bool usageAsCollateralEnabled, bool borrowingEnabled, bool stableBorrowRateEnabled, bool isActive, bool isFrozen, uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 currentLiquidityRate, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint256 availableLiquidity, uint256 totalPrincipalStableDebt, uint256 averageStableRate, uint256 stableDebtLastUpdateTimestamp, uint256 totalScaledVariableDebt, uint256 priceInMarketReferenceCurrency, uint256 priceOracle, uint256 variableRateSlope1, uint256 variableRateSlope2, uint256 stableRateSlope1, uint256 stableRateSlope2, uint256 baseStableBorrowRate, uint256 baseVariableBorrowRate, uint256 optimalUsageRatio)[] reservesData, uint256 marketReferenceCurrencyUnit, int256 marketReferenceCurrencyPriceInUsd, uint8 networkBaseTokenPriceDecimals, uint8 marketReferenceCurrencyDecimals)"
];

export const useAaveAPY = (chainId: string): UseAaveAPYReturn => {
  const [apyData, setApyData] = useState<AaveAssetAPY[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAPYData = async () => {
    try {
      setLoading(true);
      setError(null);

      const chainAddresses = addresses[chainId as keyof typeof addresses] as any;
      if (!chainAddresses?.aaveV3?.core) {
        throw new Error(`No Aave V3 configuration found for chain ${chainId}`);
      }

      const { UI_POOL_DATA_PROVIDER, POOL_ADDRESSES_PROVIDER } = chainAddresses.aaveV3.core;
      if (!UI_POOL_DATA_PROVIDER || !POOL_ADDRESSES_PROVIDER) {
        throw new Error(`Missing UI Pool Data Provider addresses for chain ${chainId}`);
      }

      // Create provider (using a public RPC for now - you might want to use your own)
      const rpcUrl = chainId === '11155111' 
        ? 'https://ethereum-sepolia.publicnode.com'
        : chainId === '1' 
        ? 'https://ethereum.publicnode.com'
        : 'https://polygon.publicnode.com';
      
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const poolDataProvider = new ethers.Contract(UI_POOL_DATA_PROVIDER, UI_POOL_DATA_PROVIDER_ABI, provider);

      // Fetch all reserves data
      const reservesResult = await poolDataProvider.getReservesData(POOL_ADDRESSES_PROVIDER);
      const reserves = reservesResult.reservesData;

      const assets = chainAddresses.aaveV3.assets;
      const apyResults: AaveAssetAPY[] = [];

      // Process each asset from addresses.json
      for (const [symbol, assetData] of Object.entries(assets)) {
        const asset = assetData as any;
        const underlyingAddress = asset.UNDERLYING;
        const decimals = asset.DECIMALS;

        // Find the reserve data for this asset
        const reserve = reserves.find((r: any) => 
          r.underlyingAsset.toLowerCase() === underlyingAddress.toLowerCase()
        );

        if (reserve) {
          // Calculate APY
          const liquidityRateRay = reserve.currentLiquidityRate;
          const supplyAPR = Number(ethers.formatUnits(liquidityRateRay, 27));
          const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
          const supplyAPY = (Math.pow(1 + supplyAPR / SECONDS_PER_YEAR, SECONDS_PER_YEAR) - 1) * 100;
          const availableLiquidity = ethers.formatUnits(reserve.availableLiquidity, decimals);

          apyResults.push({
            symbol,
            underlyingAddress,
            supplyAPY,
            supplyAPR,
            availableLiquidity,
            decimals,
            chainId
          });
        }
      }

      setApyData(apyResults);
    } catch (err) {
      console.error('Error fetching Aave APY data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch APY data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chainId) {
      fetchAPYData();
    }
  }, [chainId]);

  return {
    apyData,
    loading,
    error,
    refetch: fetchAPYData
  };
}; 