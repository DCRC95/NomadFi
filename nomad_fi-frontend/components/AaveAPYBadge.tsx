import React from 'react';
import { useAaveAPYForToken } from '../hooks/useAaveAPYForToken';

interface AaveAPYBadgeProps {
  chainId: string;
  tokenAddress: string;
  strategyName?: string;
  fallbackAPY?: string;
  className?: string;
}

export const AaveAPYBadge: React.FC<AaveAPYBadgeProps> = ({ 
  chainId, 
  tokenAddress, 
  strategyName,
  fallbackAPY = '0.00%',
  className = '' 
}) => {
  const { apy, loading, error } = useAaveAPYForToken(chainId, tokenAddress, strategyName);

  if (loading) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  if (error || apy === null) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        {fallbackAPY}
      </div>
    );
  }

  return (
    <div className={`font-medium text-green-600 ${className}`}>
      {apy.toFixed(2)}%
    </div>
  );
}; 