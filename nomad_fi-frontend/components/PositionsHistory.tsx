import React, { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { ethers } from 'ethers';
import YieldAggregatorABI from '../src/abi/YieldAggregator.json';
import { CHAIN_CONFIGS } from '../lib/chainConfig';
import addresses from '../../constants/addresses.json';
import { getTokenIcon, getTokenSymbol } from '../src/lib/tokenIcons';

interface Position {
  id: string;
  strategyId: string;
  strategyName: string;
  tokenSymbol: string;
  tokenAddress: string;
  chainId: string;
  chainName: string;
  amount: string;
  value: string;
  apy: string;
  timestamp: number;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'approve';
  strategyId: string;
  strategyName: string;
  tokenSymbol: string;
  amount: string;
  value: string;
  chainId: string;
  chainName: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
}

export const PositionsHistory: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'positions' | 'history'>('positions');
  const { address: walletAddress, isConnected } = useAccount();
  const chainId = useChainId();

  useEffect(() => {
    if (isConnected && walletAddress) {
      fetchUserData();
    } else {
      setPositions([]);
      setTransactions([]);
      setLoading(false);
    }
  }, [isConnected, walletAddress, chainId]);

  const fetchUserData = async () => {
    if (!isConnected || !walletAddress) return;

    setLoading(true);
    try {
      // Mock data for demonstration - replace with actual contract calls
      const mockPositions: Position[] = [
        {
          id: '1',
          strategyId: 'aave-usdc-sepolia',
          strategyName: 'AAVE USDC Strategy',
          tokenSymbol: 'USDC',
          tokenAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
          chainId: '11155111',
          chainName: 'Sepolia',
          amount: '1000.00',
          value: '$1000.00',
          apy: '4.25',
          timestamp: Date.now() - 86400000 * 7, // 7 days ago
        },
        {
          id: '2',
          strategyId: 'compound-weth-sepolia',
          strategyName: 'Compound WETH Strategy',
          tokenSymbol: 'WETH',
          tokenAddress: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
          chainId: '11155111',
          chainName: 'Sepolia',
          amount: '2.5',
          value: '$5000.00',
          apy: '3.85',
          timestamp: Date.now() - 86400000 * 3, // 3 days ago
        },
      ];

      const mockTransactions: Transaction[] = [
        {
          id: '1',
          type: 'deposit',
          strategyId: 'aave-usdc-sepolia',
          strategyName: 'AAVE USDC Strategy',
          tokenSymbol: 'USDC',
          amount: '1000.00',
          value: '$1000.00',
          chainId: '11155111',
          chainName: 'Sepolia',
          timestamp: Date.now() - 86400000 * 7,
          status: 'confirmed',
          txHash: '0x1234...5678',
        },
        {
          id: '2',
          type: 'deposit',
          strategyId: 'compound-weth-sepolia',
          strategyName: 'Compound WETH Strategy',
          tokenSymbol: 'WETH',
          amount: '2.5',
          value: '$5000.00',
          chainId: '11155111',
          chainName: 'Sepolia',
          timestamp: Date.now() - 86400000 * 3,
          status: 'confirmed',
          txHash: '0x8765...4321',
        },
        {
          id: '3',
          type: 'withdraw',
          strategyId: 'aave-usdc-sepolia',
          strategyName: 'AAVE USDC Strategy',
          tokenSymbol: 'USDC',
          amount: '500.00',
          value: '$500.00',
          chainId: '11155111',
          chainName: 'Sepolia',
          timestamp: Date.now() - 86400000 * 1,
          status: 'confirmed',
          txHash: '0xabcd...efgh',
        },
      ];

      setPositions(mockPositions);
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'text-green-400';
      case 'withdraw':
        return 'text-red-400';
      case 'approve':
        return 'text-yellow-400';
      default:
        return 'text-retro-text-dim';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-retro-text-dim';
    }
  };

  const getTotalValue = () => {
    return positions.reduce((total, position) => {
      const value = parseFloat(position.value.replace('$', '').replace(',', ''));
      return total + value;
    }, 0);
  };

  if (!isConnected) {
    return (
      <div className="retro-card p-6">
        <div className="retro-text text-lg mb-4">
          <span className="text-retro-text-dim">{'>'}</span> POSITIONS & HISTORY
        </div>
        <div className="retro-text-dim text-sm">
          <span className="terminal-cursor">CONNECT WALLET TO VIEW POSITIONS</span>
        </div>
      </div>
    );
  }

  return (
    <div className="retro-card p-6 h-full">
      <div className="retro-text text-lg mb-4">
        <span className="text-retro-text-dim">{'>'}</span> POSITIONS & HISTORY
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="retro-card p-3">
          <div className="retro-text-dim text-xs uppercase tracking-wider">TOTAL VALUE</div>
          <div className="retro-text text-xl font-bold">${getTotalValue().toLocaleString()}</div>
        </div>
        <div className="retro-card p-3">
          <div className="retro-text-dim text-xs uppercase tracking-wider">ACTIVE POSITIONS</div>
          <div className="retro-text text-xl font-bold">{positions.length}</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-4 border-b border-retro-border">
        <button
          onClick={() => setActiveTab('positions')}
          className={`px-4 py-2 retro-text text-sm uppercase tracking-wider transition-colors duration-200 ${
            activeTab === 'positions' 
              ? 'border-b-2 border-retro-text' 
              : 'text-retro-text-dim hover:text-retro-text'
          }`}
        >
          POSITIONS
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 retro-text text-sm uppercase tracking-wider transition-colors duration-200 ${
            activeTab === 'history' 
              ? 'border-b-2 border-retro-text' 
              : 'text-retro-text-dim hover:text-retro-text'
          }`}
        >
          HISTORY
        </button>
      </div>

      {loading ? (
        <div className="retro-text-dim text-sm">
          <span className="terminal-cursor">LOADING USER DATA...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'positions' ? (
            // Positions Tab
            <div>
              {positions.length === 0 ? (
                <div className="retro-text-dim text-sm">
                  <span className="terminal-cursor">NO ACTIVE POSITIONS FOUND</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {positions.map((position) => (
                    <div key={position.id} className="retro-card p-4 border border-retro-border">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <img 
                            src={getTokenIcon(position.tokenSymbol)} 
                            alt={position.tokenSymbol}
                            className="w-6 h-6"
                          />
                          <div>
                            <div className="retro-text font-bold">{position.strategyName}</div>
                            <div className="retro-text-dim text-xs">{position.chainName}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="retro-text font-bold">{position.value}</div>
                          <div className="retro-text-dim text-xs">{position.amount} {position.tokenSymbol}</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="retro-text-dim text-xs">
                          APY: <span className="text-green-400">{position.apy}%</span>
                        </div>
                        <div className="retro-text-dim text-xs">
                          {formatDate(position.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // History Tab
            <div>
              {transactions.length === 0 ? (
                <div className="retro-text-dim text-sm">
                  <span className="terminal-cursor">NO TRANSACTION HISTORY FOUND</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="retro-card p-4 border border-retro-border">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            tx.status === 'confirmed' ? 'bg-green-400' : 
                            tx.status === 'pending' ? 'bg-yellow-400' : 'bg-red-400'
                          }`}></div>
                          <div>
                            <div className={`retro-text font-bold uppercase ${getTransactionTypeColor(tx.type)}`}>
                              {tx.type}
                            </div>
                            <div className="retro-text-dim text-xs">{tx.strategyName}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="retro-text font-bold">{tx.value}</div>
                          <div className="retro-text-dim text-xs">{tx.amount} {tx.tokenSymbol}</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="retro-text-dim text-xs">
                          {tx.chainName}
                        </div>
                        <div className="retro-text-dim text-xs">
                          {formatDate(tx.timestamp)}
                        </div>
                      </div>
                      {tx.txHash && (
                        <div className="mt-2">
                          <div className="retro-text-dim text-xs">
                            TX: <span className="text-retro-text">{tx.txHash}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 