import React from 'react';
import { useAaveAPY } from '../hooks/useAaveAPY';

interface AaveAPYDisplayProps {
  chainId: string;
  className?: string;
}

export const AaveAPYDisplay: React.FC<AaveAPYDisplayProps> = ({ chainId, className = '' }) => {
  const { apyData, loading, error, refetch } = useAaveAPY(chainId);

  if (loading) {
    return (
      <div className={`retro-card p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="retro-spinner inline-block h-6 w-6"></div>
          <span className="ml-3 retro-text-dim">LOADING AAVE APY DATA...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`retro-card p-6 ${className}`}>
        <div className="retro-card p-4 border border-red-500">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="retro-text text-red-400 text-2xl">[!]</div>
            </div>
            <div className="ml-3">
              <h3 className="retro-text text-sm font-medium text-red-400">ERROR LOADING AAVE APY DATA</h3>
              <div className="mt-2 retro-text-dim text-sm">
                <p>{error}</p>
              </div>
              <button
                onClick={refetch}
                className="mt-2 retro-text text-sm text-red-400 hover:text-red-300 underline"
              >
                TRY AGAIN
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (apyData.length === 0) {
    return (
      <div className={`retro-card p-6 ${className}`}>
        <div className="text-center py-8">
          <p className="retro-text-dim">NO AAVE ASSETS FOUND FOR THIS NETWORK</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`retro-card p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="retro-text text-lg font-semibold mb-2">AAVE V3 SUPPLY APY</h3>
          <p className="retro-text-dim text-sm">
            REAL-TIME APY DATA FROM AAVE V3 UI POOL DATA PROVIDER
          </p>
        </div>
        <button
          onClick={refetch}
          className="retro-text text-sm hover:text-retro-hover underline"
        >
          REFRESH
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apyData.map((asset) => (
          <div
            key={`${asset.chainId}-${asset.symbol}`}
            className="retro-card p-4"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="retro-text font-medium">{asset.symbol.toUpperCase()}</h4>
                <p className="retro-text-dim text-xs truncate">
                  {asset.underlyingAddress}
                </p>
              </div>
              <div className="text-right">
                <div className="retro-text text-lg font-bold">
                  {asset.supplyAPY.toFixed(2)}%
                </div>
                <div className="retro-text-dim text-xs">
                  APY
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 