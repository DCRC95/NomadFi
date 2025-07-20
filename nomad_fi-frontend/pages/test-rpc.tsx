import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function TestRPC() {
  const [status, setStatus] = useState<string>('Testing RPC...');

  useEffect(() => {
    const testRPC = async () => {
      try {
        setStatus('Testing Sepolia RPC...');
        
        // Use the same RPC URL from your .env.local
        const provider = new ethers.JsonRpcProvider("https://sepolia.infura.io/v3/b3b18fff97b6463ca552f9334d7fe15f");
        
        setStatus('Getting block number...');
        const blockNumber = await provider.getBlockNumber();
        setStatus(`Connected! Block number: ${blockNumber}`);
        
      } catch (err) {
        console.error('RPC test error:', err);
        setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    testRPC();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">RPC Test</h1>
      <div className="bg-gray-100 p-4 rounded">
        <p><strong>Status:</strong> {status}</p>
      </div>
    </div>
  );
} 