import React, { useState, useEffect } from 'react';

export default function SimpleTest() {
  const [status, setStatus] = useState<string>('Initializing...');

  useEffect(() => {
    const testEthers = async () => {
      try {
        setStatus('Testing ethers...');
        
        // Test basic ethers functionality
        const { ethers } = await import('ethers');
        setStatus('Ethers imported successfully');
        
        // Test provider creation
        const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia.publicnode.com");
        setStatus('Provider created successfully');
        
        // Test basic call
        const blockNumber = await provider.getBlockNumber();
        setStatus(`Block number: ${blockNumber}`);
        
      } catch (err) {
        setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    testEthers();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Ethers Test</h1>
      <div className="bg-gray-100 p-4 rounded">
        <p><strong>Status:</strong> {status}</p>
      </div>
    </div>
  );
} 