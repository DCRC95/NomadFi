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
  
  console.log(`[AaveAPYBadge] ${strategyName}: loading=${loading}, error=${error}, apy=${apy}, fallbackAPY=${fallbackAPY}`);

  if (loading) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <div className="retro-spinner inline-block h-4 w-4 mr-2"></div>
        <span className="retro-text-dim">LOADING...</span>
      </div>
    );
  }

  if (error || apy === null) {
    return (
      <div className={`retro-text-dim text-sm ${className}`}>
        {fallbackAPY}
      </div>
    );
  }

  return (
    <div className={`retro-text font-medium ${className}`}>
      {apy.toFixed(2)}%
    </div>
  );
}; 