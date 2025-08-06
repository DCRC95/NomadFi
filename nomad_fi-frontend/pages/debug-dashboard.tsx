import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export default function DebugDashboard() {
  const [status, setStatus] = useState<string>('Initializing...');
  const { address: walletAddress, isConnected } = useAccount();

  useEffect(() => {
    setStatus(`Wallet: ${walletAddress || 'Not connected'}, Connected: ${isConnected}`);
  }, [walletAddress, isConnected]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Dashboard</h1>
      <div className="bg-gray-100 p-4 rounded">
        <p><strong>Status:</strong> {status}</p>
        <p><strong>Wallet Address:</strong> {walletAddress || 'None'}</p>
        <p><strong>Is Connected:</strong> {isConnected ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
} 