import React from 'react';
import { useChainId } from 'wagmi';
import { AaveAPYDisplay } from '../components/AaveAPYDisplay';
import { AaveAPYBadge } from '../components/AaveAPYBadge';
import addresses from '../../constants/addresses.json';

const AaveAPYDemo: React.FC = () => {
  const chainId = useChainId();
  const chainIdStr = chainId?.toString() || '11155111'; // Default to Sepolia

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Aave V3 APY Demo
          </h1>
          <p className="text-lg text-gray-600">
            Real-time APY data from Aave V3 UI Pool Data Provider
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Current Chain: {chainIdStr}
          </p>
        </div>

        {/* Full APY Display Component */}
        <div className="mb-8">
          <AaveAPYDisplay chainId={chainIdStr} />
        </div>

        {/* Individual Token APY Badges */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Individual Token APY Badges
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            These badges can be used in strategy cards to show real-time Aave APY
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(() => {
              const chainAddresses = addresses[chainIdStr as keyof typeof addresses] as any;
              if (!chainAddresses?.aaveV3?.assets) return null;

              return Object.entries(chainAddresses.aaveV3.assets).map(([symbol, assetData]) => {
                const asset = assetData as any;
                return (
                  <div key={symbol} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-900">{symbol}</h4>
                        <p className="text-xs text-gray-500 truncate">
                          {asset.UNDERLYING}
                        </p>
                      </div>
                      <div className="text-right">
                        <AaveAPYBadge 
                          chainId={chainIdStr}
                          tokenAddress={asset.UNDERLYING}
                          fallbackAPY="0.00%"
                        />
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Integration Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            How to Integrate into Your Dashboard
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>1. For individual strategy cards:</strong></p>
            <pre className="bg-blue-100 p-2 rounded text-xs overflow-x-auto">
{`// Replace your existing APY display with:
<AaveAPYBadge 
  chainId={chainId.toString()}
  tokenAddress={strategy.tokenAddress}
  fallbackAPY={formatAPY(strategy.apy, strategy.strategyType)}
/>`}
            </pre>
            
            <p><strong>2. For a dedicated APY section:</strong></p>
            <pre className="bg-blue-100 p-2 rounded text-xs overflow-x-auto">
{`// Add this to your dashboard:
<AaveAPYDisplay chainId={chainId.toString()} />`}
            </pre>
            
            <p><strong>3. Import the components:</strong></p>
            <pre className="bg-blue-100 p-2 rounded text-xs overflow-x-auto">
{`import { AaveAPYBadge } from '../components/AaveAPYBadge';
import { AaveAPYDisplay } from '../components/AaveAPYDisplay';`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AaveAPYDemo; 