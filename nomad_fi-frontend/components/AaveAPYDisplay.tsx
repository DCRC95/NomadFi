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
      <div className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading Aave APY data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading Aave APY data</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <button
                onClick={refetch}
                className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (apyData.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 ${className}`}>
        <div className="text-center py-8">
          <p className="text-gray-500">No Aave assets found for this network</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Aave V3 Supply APY</h3>
          <p className="text-sm text-gray-600">
            Real-time APY data from Aave V3 UI Pool Data Provider
          </p>
        </div>
        <button
          onClick={refetch}
          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-500 underline"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apyData.map((asset) => (
          <div
            key={`${asset.chainId}-${asset.symbol}`}
            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium text-gray-900">{asset.symbol}</h4>
                <p className="text-xs text-gray-500 truncate">
                  {asset.underlyingAddress}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">
                  {asset.supplyAPY.toFixed(2)}%
                </div>
                <div className="text-xs text-gray-500">
                  APY
                </div>
              </div>
            </div>
            
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>APR:</span>
                <span>{(asset.supplyAPR * 100).toFixed(4)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Liquidity:</span>
                <span className="truncate">
                  {parseFloat(asset.availableLiquidity).toLocaleString()} {asset.symbol}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Data fetched from Aave V3 UI Pool Data Provider
      </div>
    </div>
  );
}; 