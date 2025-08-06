import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CHAIN_CONFIGS } from '../lib/chainConfig';
import YieldAggregatorABI from '../src/abi/YieldAggregator.json';

export default function TestContracts() {
  const [status, setStatus] = useState<string>('Initializing...');
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const testContracts = async () => {
      setStatus('Testing contracts...');
      const testResults = [];

      try {
        // Test Sepolia first
        const sepoliaConfig = CHAIN_CONFIGS.find(chain => chain.id === "11155111");
        if (sepoliaConfig) {
          setStatus('Testing Sepolia contracts...');
          
          const provider = new ethers.JsonRpcProvider(sepoliaConfig.rpcUrl);
          const aggregator = new ethers.Contract(
            sepoliaConfig.aggregatorAddress,
            YieldAggregatorABI.abi,
            provider
          );

          try {
            const strategyIds = await aggregator.getAllStrategyIds();
            testResults.push({
              chain: 'Sepolia',
              strategyCount: strategyIds.length,
              strategyIds: strategyIds.map((id: any) => id.toString()),
              success: true
            });
            setStatus(`Found ${strategyIds.length} strategies on Sepolia`);
          } catch (err) {
            testResults.push({
              chain: 'Sepolia',
              error: err instanceof Error ? err.message : 'Unknown error',
              success: false
            });
            setStatus('Error testing Sepolia contracts');
          }
        }

        // Test other chains
        for (const chain of CHAIN_CONFIGS) {
          if (chain.id === "11155111") continue; // Already tested
          
          setStatus(`Testing ${chain.name} contracts...`);
          
          try {
            const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
            const aggregator = new ethers.Contract(
              chain.aggregatorAddress,
              YieldAggregatorABI.abi,
              provider
            );

            const strategyIds = await aggregator.getAllStrategyIds();
            testResults.push({
              chain: chain.name,
              strategyCount: strategyIds.length,
              strategyIds: strategyIds.map((id: any) => id.toString()),
              success: true
            });
          } catch (err) {
            testResults.push({
              chain: chain.name,
              error: err instanceof Error ? err.message : 'Unknown error',
              success: false
            });
          }
        }

        setResults(testResults);
        setStatus('Testing complete');
      } catch (err) {
        setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    testContracts();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Contract Test</h1>
      <div className="bg-gray-100 p-4 rounded mb-4">
        <p><strong>Status:</strong> {status}</p>
      </div>
      
      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={index} className={`p-4 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <h3 className="font-bold">{result.chain}</h3>
            {result.success ? (
              <div>
                <p>Strategies: {result.strategyCount}</p>
                <p>IDs: {result.strategyIds?.join(', ') || 'None'}</p>
              </div>
            ) : (
              <p className="text-red-600">Error: {result.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 