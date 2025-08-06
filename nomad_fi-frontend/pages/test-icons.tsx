import React from 'react';
import { getTokenIcon, getTokenSymbol } from '../src/lib/tokenIcons';

export default function TestIcons() {
  const testStrategies = [
    { name: 'AaveV3LINKStrategy', tokenAddress: '0x123', chainId: '11155111' },
    { name: 'AaveV3USDCStrategy', tokenAddress: '0x456', chainId: '11155111' },
    { name: 'AaveV3WBTCStrategy', tokenAddress: '0x789', chainId: '11155111' },
    { name: 'AaveV3AAVEStrategy', tokenAddress: '0xabc', chainId: '11155111' },
  ];

  return (
    <div className="p-8 bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-4">Token Icon Test</h1>
      
      {testStrategies.map((strategy, index) => {
        const tokenSymbol = getTokenSymbol(strategy.name, strategy.tokenAddress, strategy.chainId);
        const iconPath = getTokenIcon(tokenSymbol);
        
        return (
          <div key={index} className="mb-4 p-4 border border-gray-600 rounded">
            <h2 className="text-lg font-semibold mb-2">{strategy.name}</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img 
                  src={iconPath} 
                  alt={`${tokenSymbol} icon`}
                  className="w-8 h-8 rounded-full border-2 border-white"
                  onError={(e) => {
                    console.error('Failed to load icon:', iconPath, e);
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextSibling as HTMLDivElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                  onLoad={(e) => {
                    console.log('Icon loaded successfully:', iconPath);
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'block';
                    const fallback = target.nextSibling as HTMLDivElement;
                    if (fallback) fallback.style.display = 'none';
                  }}
                  style={{ objectFit: 'cover' }}
                />
                <div 
                  className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ display: 'none' }}
                >
                  {tokenSymbol.slice(0, 2)}
                </div>
              </div>
              <div>
                <p><strong>Token Symbol:</strong> {tokenSymbol}</p>
                <p><strong>Icon Path:</strong> {iconPath}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 