import React, { useState, useEffect } from 'react';
import { useAccount, useChainId, useSwitchChain, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import YieldAggregatorABI from '../src/abi/YieldAggregator.json';
import MockERC20ABI from '../src/abi/MockERC20.json';
import { CHAIN_CONFIGS } from '../lib/chainConfig';
import addresses from '../../constants/addresses.json';
import { AaveAPYBadge } from './AaveAPYBadge';
import { calculateRiskCategory } from '../src/lib/riskUtils';
import { getTokenIcon, getTokenSymbol as getTokenSymbolUtil } from '../src/lib/tokenIcons';
import { formatStrategyDisplayName } from '../src/lib/strategyUtils';

interface Strategy {
  id: string;
  chainId: string;
  chainName: string;
  name: string;
  tokenAddress: string;
  strategyAddress: string;
  strategyType: number;
  isActive: boolean;
  apy: string;
  tvl: string;
  totalDeposits: string;
}

interface ApprovalStatus {
  [strategyId: string]: {
    needsApproval: boolean;
    allowance: string;
    approvedAmount: string;
  };
}

export const NewStrategyDashboard: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableChains, setAvailableChains] = useState<string[]>([]);
  const [activeAction, setActiveAction] = useState<{strategyId: string, action: 'deposit' | 'withdraw'} | null>(null);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userBalances, setUserBalances] = useState<{[key: string]: string}>({});
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>({});
  const [filterRiskCategories, setFilterRiskCategories] = useState<string[]>(['Very Low', 'Low', 'Medium', 'High', 'Very High']);
  const { address: walletAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    const fetchStrategies = async () => {
      console.log('NewStrategyDashboard: Starting to fetch strategies...');
      setLoading(true);
      setError(null);

      const allStrategies: Strategy[] = [];
      const workingChains: string[] = [];

      try {
        // Only fetch from active chains
        const activeChains = CHAIN_CONFIGS.filter(chain => chain.isActive);
        console.log(`Found ${activeChains.length} active chains`);

        for (const chain of activeChains) {
          try {
            console.log(`Testing connection to ${chain.name} (${chain.id})...`);
            
            // Test connection with a proper timeout and error handling
            const testConnection = async (rpcUrl: string): Promise<boolean> => {
              try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
                
                const response = await fetch(rpcUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_blockNumber',
                    params: [],
                    id: 1
                  }),
                  signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}`);
                }
                
                const result = await response.json();
                return result.result !== undefined;
              } catch (error) {
                console.warn(`Connection test failed for ${chain.name}:`, error);
                return false;
              }
            };
            
            const isConnected = await testConnection(chain.rpcUrl);
            
            if (!isConnected) {
              console.warn(`✗ Failed to connect to ${chain.name} (${chain.id}) - skipping`);
              continue;
            }
            
            console.log(`✓ Successfully connected to ${chain.name}`);
            workingChains.push(chain.id);
            
            // Create provider only after successful connection test
            const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
            
            // Create contract instance
            const aggregator = new ethers.Contract(
              chain.aggregatorAddress,
              YieldAggregatorABI.abi,
              provider
            );

            // Get strategy IDs
            const strategyIds = await aggregator.getAllStrategyIds();
            console.log(`Found ${strategyIds.length} strategies on ${chain.name}`);

            // Get individual strategy data (avoiding batch call issues)
            for (const strategyId of strategyIds) {
              try {
                const strategyData = await aggregator.getStrategyData(strategyId);
                
                // Debug APY values
                console.log(`Strategy ${strategyId} APY raw value:`, strategyData.apy.toString());
                console.log(`Strategy ${strategyId} APY formatted:`, formatAPY(strategyData.apy.toString(), strategyData.strategyType));
                console.log(`Strategy ${strategyId} type:`, strategyData.strategyType, `(${getStrategyTypeName(strategyData.strategyType)})`);
                console.log(`Strategy ${strategyId} name:`, strategyData.name);
                console.log(`Strategy ${strategyId} address:`, strategyData.strategyAddress);
                console.log(`Strategy ${strategyId} tokenAddress:`, strategyData.tokenAddress);
                console.log(`Strategy ${strategyId} isActive:`, strategyData.isActive);
                console.log(`Strategy ${strategyId} raw data:`, {
                  apy: strategyData.apy.toString(),
                  tvl: strategyData.totalValueLocked.toString(),
                  deposits: strategyData.totalDeposits.toString()
                });
                console.log(`Strategy ${strategyId} full data:`, {
                  name: strategyData.name,
                  type: strategyData.strategyType,
                  typeName: getStrategyTypeName(strategyData.strategyType),
                  tokenAddress: strategyData.tokenAddress,
                  strategyAddress: strategyData.strategyAddress,
                  isActive: strategyData.isActive
                });
                
                // Fallback: If APY is 0 and it's a Compound strategy, try calling APY directly
                let finalApy = strategyData.apy.toString();
                const strategyTypeNum = Number(strategyData.strategyType);
                if (strategyData.apy.toString() === '0' && strategyTypeNum === 2) { // StrategyType.Compound
                  console.log(`Attempting to get APY directly from Compound strategy ${strategyData.strategyAddress}...`);
                  try {
                    const strategyContract = new ethers.Contract(
                      strategyData.strategyAddress,
                      YieldAggregatorABI.abi, // Using same ABI for now
                      provider
                    );
                    const directApy = await strategyContract.apy();
                    finalApy = directApy.toString();
                    console.log(`Direct APY call successful: ${finalApy}`);
                  } catch (directApyErr) {
                    console.warn(`Direct APY call failed for Compound strategy:`, directApyErr);
                  }
                }
                
                // Fallback: If APY is 0 and it's an Aave strategy, try calling APY directly
                if (strategyData.apy.toString() === '0' && strategyTypeNum === 1) { // StrategyType.Aave
                  console.log(`Attempting to get APY directly from Aave strategy ${strategyData.strategyAddress}...`);
                  try {
                    const strategyContract = new ethers.Contract(
                      strategyData.strategyAddress,
                      YieldAggregatorABI.abi, // Using same ABI for now
                      provider
                    );
                    const directApy = await strategyContract.apy();
                    finalApy = directApy.toString();
                    console.log(`Direct APY call successful: ${finalApy}`);
                  } catch (directApyErr) {
                    console.warn(`Direct APY call failed for Aave strategy:`, directApyErr);
                    // If direct call fails, keep the 0 value but log it's likely due to 0% rates on testnet
                    console.log(`Note: Aave strategies may show 0% APY on testnet due to low/no supply rates`);
                  }
                }

                const strategy: Strategy = {
                  id: strategyId.toString(),
                  chainId: chain.id,
                  chainName: chain.name,
                  name: strategyData.name,
                  tokenAddress: strategyData.tokenAddress,
                  strategyAddress: strategyData.strategyAddress,
                  strategyType: strategyData.strategyType,
                  isActive: strategyData.isActive,
                  apy: finalApy,
                  tvl: strategyData.totalValueLocked.toString(),
                  totalDeposits: strategyData.totalDeposits.toString()
                };

                allStrategies.push(strategy);
                console.log(`Added strategy: ${strategy.name} on ${chain.name} with APY: ${formatAPY(strategy.apy, strategy.strategyType)}`);
              } catch (err) {
                console.warn(`Failed to get data for strategy ${strategyId} on ${chain.name}:`, err);
              }
            }

          } catch (err) {
            console.warn(`✗ Failed to fetch from ${chain.name} (${chain.id}):`, err);
            console.log(`Chain ${chain.name} will be skipped for this session`);
            // Don't add to workingChains, so it won't be used
          }
        }

        setAvailableChains(workingChains);
        console.log(`Total strategies found: ${allStrategies.length}`);
        console.log(`Working chains: ${workingChains.join(', ')}`);
        setStrategies(allStrategies);

      } catch (err) {
        console.error('Error in fetchStrategies:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch strategies');
      } finally {
        setLoading(false);
      }
    };

    fetchStrategies();
  }, []);

  const fetchUserBalances = async () => {
    if (!walletAddress || !walletClient) return;

    console.log('Fetching user token balances...');
    const balances: {[key: string]: string} = {};

    try {
      for (const strategy of strategies) {
        try {
          const chainConfig = CHAIN_CONFIGS.find(c => c.id === strategy.chainId);
          if (!chainConfig) continue;

          // Create provider for the specific chain
          const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
          
          // Create token contract
          const tokenContract = new ethers.Contract(
            strategy.tokenAddress,
            MockERC20ABI.abi,
            provider
          );

          // Get user's balance
          const balance = await tokenContract.balanceOf(walletAddress);
          const decimals = getTokenDecimals(strategy.tokenAddress, strategy.chainId);
          const formattedBalance = formatAmountWithDecimals(balance, decimals);
          
          balances[strategy.id] = formattedBalance;
          console.log(`Balance for ${strategy.name}: ${formattedBalance}`);
          
        } catch (err) {
          console.warn(`Failed to get balance for strategy ${strategy.name}:`, err);
          balances[strategy.id] = '0';
        }
      }

      setUserBalances(balances);
    } catch (err) {
      console.error('Error fetching user balances:', err);
    }
  };

  const fetchApprovalStatus = async () => {
    if (!walletAddress || !walletClient) return;

    console.log('Fetching approval status...');
    const approvals: ApprovalStatus = {};

    try {
      for (const strategy of strategies) {
        try {
          const chainConfig = CHAIN_CONFIGS.find(c => c.id === strategy.chainId);
          if (!chainConfig) continue;

          const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
          const tokenContract = new ethers.Contract(
            strategy.tokenAddress,
            MockERC20ABI.abi,
            provider
          );

          // Check allowance for the YieldAggregator contract (not the strategy)
          const allowance = await tokenContract.allowance(walletAddress, chainConfig.aggregatorAddress);
          const decimals = getTokenDecimals(strategy.tokenAddress, strategy.chainId);
          const formattedAllowance = formatAmountWithDecimals(allowance, decimals);
          
          approvals[strategy.id] = {
            needsApproval: false, // Will be set based on amount
            allowance: formattedAllowance,
            approvedAmount: formattedAllowance
          };
          
          console.log(`Approval status for ${strategy.name}: ${formattedAllowance} (to YieldAggregator: ${chainConfig.aggregatorAddress})`);
        } catch (err) {
          console.warn(`Failed to get approval status for ${strategy.name}:`, err);
          approvals[strategy.id] = {
            needsApproval: true,
            allowance: '0.0000',
            approvedAmount: '0.0000'
          };
        }
      }

      setApprovalStatus(approvals);
    } catch (err) {
      console.error('Error fetching approval status:', err);
    }
  };

  // Fetch balances when strategies or wallet changes
  useEffect(() => {
    if (strategies.length > 0 && walletAddress) {
      fetchUserBalances();
      fetchApprovalStatus();
    }
  }, [strategies, walletAddress]);

  const handleSwitchChain = async (targetChainId: string) => {
    try {
      const chainIdNum = parseInt(targetChainId);
      await switchChain?.({ chainId: chainIdNum });
    } catch (error) {
      console.error('Failed to switch chain:', error);
    }
  };

  const handleActionClick = (strategyId: string, action: 'deposit' | 'withdraw') => {
    setActiveAction({ strategyId, action });
    setAmount('');
  };

  const handleCancelAction = () => {
    setActiveAction(null);
    setAmount('');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      
      // Update approval status when amount changes
      if (activeAction && activeAction.action === 'deposit' && approvalStatus[activeAction.strategyId]) {
        const currentAllowance = parseFloat(approvalStatus[activeAction.strategyId].allowance);
        const newAmount = parseFloat(value || '0');
        
        setApprovalStatus(prev => ({
          ...prev,
          [activeAction.strategyId]: {
            ...prev[activeAction.strategyId],
            needsApproval: currentAllowance < newAmount
          }
        }));
      }
    }
  };

  const handleMaxAmount = () => {
    if (!activeAction) return;
    
    const strategy = strategies.find(s => s.id === activeAction.strategyId);
    if (!strategy) return;
    
    const balance = userBalances[strategy.id];
    if (balance && parseFloat(balance) > 0) {
      setAmount(balance);
    }
  };

  const handleApprove = async (strategyId: string, amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount to approve');
      return;
    }

    setIsProcessing(true);
    try {
      const strategy = strategies.find(s => s.id === strategyId);
      if (!strategy) {
        throw new Error('Strategy not found');
      }

      const chainConfig = CHAIN_CONFIGS.find(c => c.id === strategy.chainId);
      if (!chainConfig) {
        throw new Error('Chain configuration not found');
      }

      if (!walletClient) {
        throw new Error('Wallet not connected');
      }

      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();

      const amountWei = parseAmountWithDecimals(amount, getTokenDecimals(strategy.tokenAddress, strategy.chainId));

      console.log(`Approving ${amount} ${getTokenSymbol(strategy.name, strategy.tokenAddress, strategy.chainId)} for YieldAggregator (${chainConfig.aggregatorAddress})...`);
      
      const tokenContract = new ethers.Contract(
        strategy.tokenAddress,
        MockERC20ABI.abi,
        signer
      );

      const approveTx = await tokenContract.approve(chainConfig.aggregatorAddress, amountWei);
      console.log('Approval transaction hash:', approveTx.hash);
      
      const approveReceipt = await approveTx.wait();
      console.log('Approval confirmed in block:', approveReceipt.blockNumber);
      
      alert('Token approval confirmed! You can now proceed with the deposit.');
      
      // Refresh approval status
      await fetchApprovalStatus();
      
    } catch (error) {
      console.error('Error during approval:', error);
      alert(`Error during approval: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitAction = async () => {
    if (!activeAction || !amount || parseFloat(amount) <= 0) {
      return;
    }

    setIsProcessing(true);
    try {
      const strategy = strategies.find(s => s.id === activeAction.strategyId);
      if (!strategy) {
        throw new Error('Strategy not found');
      }

      const chainConfig = CHAIN_CONFIGS.find(c => c.id === strategy.chainId);
      if (!chainConfig) {
        throw new Error('Chain configuration not found');
      }

      if (!walletClient) {
        throw new Error('Wallet not connected');
      }

      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();

      const amountWei = parseAmountWithDecimals(amount, getTokenDecimals(strategy.tokenAddress, strategy.chainId));

      if (activeAction.action === 'deposit') {
        // Check if approval is needed
        const tokenContract = new ethers.Contract(
          strategy.tokenAddress,
          MockERC20ABI.abi,
          signer
        );
        
        const currentAllowance = await tokenContract.allowance(walletAddress, chainConfig.aggregatorAddress);
        if (currentAllowance < amountWei) {
          alert('Please approve tokens first before depositing');
          return;
        }

        console.log(`Depositing ${amount} ${getTokenSymbol(strategy.name, strategy.tokenAddress, strategy.chainId)} to YieldAggregator...`);
        console.log(`Contract call params: tokenAddress=${strategy.tokenAddress}, amountWei=${amountWei}, strategyId=${parseInt(strategy.id)}`);
        
        const aggregatorContract = new ethers.Contract(
          chainConfig.aggregatorAddress,
          YieldAggregatorABI.abi,
          signer
        );

        // Call YieldAggregator.deposit(tokenAddress, amount, strategyId)
        const depositTx = await aggregatorContract.deposit(strategy.tokenAddress, amountWei, parseInt(strategy.id));
        console.log('Deposit transaction hash:', depositTx.hash);
        
        const depositReceipt = await depositTx.wait();
        console.log('Deposit confirmed in block:', depositReceipt.blockNumber);
        
        alert('Deposit completed successfully!');
        
      } else if (activeAction.action === 'withdraw') {
        console.log(`Withdrawing ${amount} ${getTokenSymbol(strategy.name, strategy.tokenAddress, strategy.chainId)} from YieldAggregator...`);
        console.log(`Contract call params: tokenAddress=${strategy.tokenAddress}, amountWei=${amountWei}, strategyId=${parseInt(strategy.id)}`);
        
        const aggregatorContract = new ethers.Contract(
          chainConfig.aggregatorAddress,
          YieldAggregatorABI.abi,
          signer
        );

        // Call YieldAggregator.withdraw(tokenAddress, amount, strategyId)
        const withdrawTx = await aggregatorContract.withdraw(strategy.tokenAddress, amountWei, parseInt(strategy.id));
        console.log('Withdraw transaction hash:', withdrawTx.hash);
        
        const withdrawReceipt = await withdrawTx.wait();
        console.log('Withdraw confirmed in block:', withdrawReceipt.blockNumber);
        
        alert('Withdrawal completed successfully!');
      }

      handleCancelAction();
      
    } catch (error) {
      console.error(`Error during ${activeAction.action}:`, error);
      alert(`Error during ${activeAction.action}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAPY = (apy: string, strategyType: number) => {
    try {
      console.log(`formatAPY called with apy: "${apy}", strategyType: ${strategyType} (type: ${typeof strategyType})`);
      const apyNum = parseFloat(apy);
      const strategyTypeNum = Number(strategyType);
      console.log(`parseFloat result: ${apyNum}`);
      console.log(`strategyType as number: ${strategyTypeNum}`);
      
      console.log(`strategyTypeNum === 0: ${strategyTypeNum === 0}`);
      console.log(`strategyTypeNum === 1: ${strategyTypeNum === 1}`);
      console.log(`strategyTypeNum === 2: ${strategyTypeNum === 2}`);
      
      if (strategyTypeNum === 0) {
        // Mock strategy: returns basis points (e.g., 500 = 5%)
        const result = `${(apyNum / 100).toFixed(2)}%`;
        console.log(`Mock strategy calculation: ${apyNum} / 100 = ${apyNum / 100}, result: ${result}`);
        return result;
      } else {
        // Aave/Compound strategies: returns 18 decimals (e.g., 0.05 * 10^18 = 5% APY)
        const result = `${(apyNum / 1e18).toFixed(2)}%`;
        console.log(`Aave/Compound strategy calculation: ${apyNum} / 1e18 = ${apyNum / 1e18}, result: ${result}`);
        return result;
      }
    } catch (error) {
      console.error('Error in formatAPY:', error);
      return '0.00%';
    }
  };

  const formatBalance = (balance: string, tokenAddress: string, chainId: string) => {
    try {
      const decimals = getTokenDecimals(tokenAddress, chainId);
      const balanceNum = parseFloat(balance) / Math.pow(10, decimals);
      return balanceNum.toFixed(4);
    } catch {
      return '0.0000';
    }
  };

  const getTokenSymbol = (strategyName: string, tokenAddress?: string, chainId?: string) => {
    // First try to get symbol from token address if available
    if (tokenAddress && chainId) {
      try {
        const chainAddresses = addresses[chainId as keyof typeof addresses] as any;
        if (chainAddresses?.aaveV3?.assets) {
          for (const [symbol, asset] of Object.entries(chainAddresses.aaveV3.assets)) {
            const assetData = asset as any;
            if (assetData.UNDERLYING.toLowerCase() === tokenAddress.toLowerCase()) {
              return symbol;
            }
          }
        }
      } catch (error) {
        console.warn('Error getting token symbol from address, falling back to name parsing:', error);
      }
    }

    // Fallback to name parsing
    const nameLower = strategyName.toLowerCase();
    if (nameLower.includes('link')) return 'LINK';
    if (nameLower.includes('weth')) return 'WETH';
    if (nameLower.includes('usdc')) return 'USDC';
    if (nameLower.includes('wbtc')) return 'WBTC';
    if (nameLower.includes('aave')) return 'AAVE';
    if (nameLower.includes('eurs')) return 'EURS';
    if (nameLower.includes('dai')) return 'DAI';
    if (nameLower.includes('usdt')) return 'USDT';
    return 'ETH';
  };

  const getStrategyTypeName = (type: number) => {
    switch (type) {
      case 0: return 'Mock';      // StrategyType.Mock
      case 1: return 'Aave';      // StrategyType.Aave
      case 2: return 'Compound';  // StrategyType.Compound
      default: return 'Unknown';
    }
  };

  const getRiskCategory = (strategy: Strategy): string => {
    try {
      // Create a strategy object with baseRiskScore for risk calculation
      const strategyTypeNum = Number(strategy.strategyType);
      const baseRiskScore = strategyTypeNum === 0 ? 2 : strategyTypeNum === 1 ? 4 : 6; // Mock = Low risk, Aave = Medium risk, Compound = Higher risk
      const strategyWithRisk = {
        ...strategy,
        chainId: Number(strategy.chainId),
        baseRiskScore: baseRiskScore,
      };
      return calculateRiskCategory(strategyWithRisk);
    } catch {
      return 'Unknown';
    }
  };

  const getRiskColor = (riskCategory: string) => {
    return riskCategory === "Very Low" || riskCategory === "Low"
      ? "text-retro-text bg-retro-card border-retro-border"
      : riskCategory === "Medium"
      ? "text-yellow-400 bg-retro-card border-yellow-400"
      : riskCategory === "High" || riskCategory === "Very High"
      ? "text-red-400 bg-retro-card border-red-400"
      : "text-retro-text-dim bg-retro-card border-retro-text-dim";
  };

  const filteredStrategies = strategies.filter(strategy => {
    const riskCategory = getRiskCategory(strategy);
    return filterRiskCategories.includes(riskCategory);
  });

  const getTokenDecimals = (tokenAddress: string, chainId: string): number => {
    try {
      const chainAddresses = addresses[chainId as keyof typeof addresses] as any;
      if (!chainAddresses) return 18; // Default to 18 decimals

      // Check if it's a known Aave asset
      if (chainAddresses.aaveV3?.assets) {
        for (const [symbol, asset] of Object.entries(chainAddresses.aaveV3.assets)) {
          const assetData = asset as any;
          if (assetData.UNDERLYING.toLowerCase() === tokenAddress.toLowerCase()) {
            return assetData.DECIMALS;
          }
        }
      }

      // Check if it's the MockERC20 (usually 18 decimals)
      if (chainAddresses.deployedContracts?.MockERC20?.toLowerCase() === tokenAddress.toLowerCase()) {
        return 18;
      }

      // Default to 18 decimals for unknown tokens
      return 18;
    } catch (error) {
      console.warn('Error getting token decimals, defaulting to 18:', error);
      return 18;
    }
  };

  const parseAmountWithDecimals = (amount: string, decimals: number): bigint => {
    try {
      return ethers.parseUnits(amount, decimals);
    } catch (error) {
      console.error('Error parsing amount:', error);
      throw new Error('Invalid amount format');
    }
  };

  const formatAmountWithDecimals = (amount: bigint, decimals: number): string => {
    try {
      return ethers.formatUnits(amount, decimals);
    } catch (error) {
      console.error('Error formatting amount:', error);
      return '0';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-retro-darker py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="retro-spinner inline-block h-8 w-8"></div>
            <p className="mt-4 retro-text-dim">TESTING CONNECTIONS AND LOADING STRATEGIES FROM YIELDAGGREGATOR CONTRACTS...</p>
            <p className="mt-2 retro-text-dim text-sm">CHAINS THAT FAIL TO CONNECT WILL BE AUTOMATICALLY SKIPPED</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-retro-darker py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="retro-card p-4 border border-red-500">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="retro-text text-red-400 text-2xl">[!]</div>
              </div>
              <div className="ml-3">
                <h3 className="retro-text text-sm font-medium text-red-400">ERROR LOADING STRATEGIES</h3>
                <div className="mt-2 retro-text-dim text-sm">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-retro-darker py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="retro-text text-4xl font-bold mb-4">
            STRATEGY TERMINAL
          </h1>
          <p className="retro-text-dim text-lg">
            YIELD STRATEGIES FROM YIELDAGGREGATOR CONTRACTS ACROSS MULTIPLE CHAINS
          </p>
        </div>

        {/* Network Selector */}
        <div className="retro-card p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="retro-text text-lg font-semibold mb-2">NETWORK STATUS</h3>
              <p className="retro-text-dim text-sm">
                CURRENT CHAIN: {chainId ? `CHAIN ID ${chainId}` : 'NOT CONNECTED'}
              </p>
              <p className="retro-text-dim text-sm">
                AVAILABLE CHAINS: {availableChains.length > 0 ? availableChains.join(', ').toUpperCase() : 'NONE'}
              </p>
            </div>
            
            {walletAddress && (
              <div className="flex space-x-2">
                {CHAIN_CONFIGS.filter(chain => chain.isActive).map((chain) => {
                  const isCurrentChain = chainId === parseInt(chain.id);
                  const isAvailable = availableChains.includes(chain.id);
                  
                  return (
                    <button
                      key={chain.id}
                      onClick={() => handleSwitchChain(chain.id)}
                      disabled={isCurrentChain || !isAvailable}
                      className={`retro-button text-sm font-medium ${
                        isCurrentChain
                          ? 'bg-retro-disabled text-retro-text cursor-default border-retro-text'
                          : isAvailable
                          ? 'hover:shadow-retro'
                          : 'bg-retro-disabled text-retro-text-dim cursor-not-allowed border-retro-text-dim'
                      }`}
                    >
                      {isCurrentChain ? '✓ ' : ''}{chain.name.toUpperCase()}
                      {!isAvailable && ' (OFFLINE)'}
                    </button>
                  );
                })}
              </div>
            )}
            
            {!walletAddress && (
              <div className="retro-text-dim text-sm">
                CONNECT WALLET TO SWITCH NETWORKS
              </div>
            )}
          </div>
        </div>

        {/* Risk Filter Section */}
        <div className="retro-card p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div>
              <h3 className="retro-text text-lg font-semibold mb-2">RISK FILTER</h3>
              <p className="retro-text-dim text-sm">
                FILTER STRATEGIES BY RISK TOLERANCE
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => setFilterRiskCategories(['Very Low', 'Low', 'Medium', 'High', 'Very High'])}
                className="retro-text text-sm hover:text-retro-hover underline"
              >
                SHOW ALL
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {['Very Low', 'Low', 'Medium', 'High', 'Very High'].map((risk) => (
              <button
                key={risk}
                onClick={() => {
                  if (filterRiskCategories.includes(risk)) {
                    setFilterRiskCategories(prev => prev.filter(r => r !== risk));
                  } else {
                    setFilterRiskCategories(prev => [...prev, risk]);
                  }
                }}
                className={`retro-button text-sm font-medium ${
                  filterRiskCategories.includes(risk)
                    ? 'border-retro-text bg-retro-card'
                    : 'border-retro-text-dim bg-retro-dark text-retro-text-dim hover:bg-retro-card'
                }`}
              >
                {risk.toUpperCase()} RISK
              </button>
            ))}
          </div>
        </div>

        {filteredStrategies.length === 0 ? (
          <div className="text-center py-12">
            <div className="retro-text text-6xl mb-4">[ ]</div>
            <h3 className="mt-2 retro-text text-sm font-medium">NO STRATEGIES FOUND</h3>
            <p className="mt-1 retro-text-dim text-sm">NO ACTIVE YIELD STRATEGIES ARE CURRENTLY AVAILABLE.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="retro-text text-2xl font-bold">
                FOUND {filteredStrategies.length} OF {strategies.length} STRATEGIES
              </h2>
            </div>
            
            {filteredStrategies.map((strategy) => {
              const isCurrentChain = chainId === parseInt(strategy.chainId);
              const tokenSymbol = getTokenSymbol(strategy.name, strategy.tokenAddress, strategy.chainId);
              const riskCategory = getRiskCategory(strategy);
              const riskColor = getRiskColor(riskCategory);
              
              return (
                <div key={`${strategy.chainId}-${strategy.id}`} className="retro-card p-6 mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {(() => {
                          const tokenSymbol = getTokenSymbolUtil(strategy.name, strategy.tokenAddress, strategy.chainId);
                          const iconPath = getTokenIcon(tokenSymbol);
                          console.log('NewStrategyDashboard rendering icon:', { strategyName: strategy.name, tokenSymbol, iconPath });
                          return (
                            <div className="flex items-center gap-2">
                              <div 
                                style={{ 
                                  width: '32px',
                                  height: '32px',
                                  backgroundColor: 'white',
                                  border: '2px solid white',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundImage: `url(${iconPath})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  backgroundRepeat: 'no-repeat'
                                }}
                              />
                            </div>
                          );
                        })()}
                        {(() => {
                          const displayName = formatStrategyDisplayName(strategy.name);
                          return (
                            <div>
                              <h3 className="retro-text text-xl font-semibold">{displayName.mainTitle}</h3>
                              <p className="retro-text-dim text-xs">{displayName.subtitle}</p>
                            </div>
                          );
                        })()}
                      </div>
                      <p className="retro-text-dim text-sm">
                        {getStrategyTypeName(strategy.strategyType).toUpperCase()} STRATEGY ON {strategy.chainName.toUpperCase()} (TYPE: {strategy.strategyType})
                      </p>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className="retro-text text-xs border border-retro-border px-2 py-1">
                          {strategy.chainName.toUpperCase()}
                        </span>
                        <span className={`retro-text text-xs px-2 py-1 border ${
                          strategy.isActive ? 'border-retro-text' : 'border-red-500 text-red-400'
                        }`}>
                          {strategy.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                        <span className={`retro-text text-xs px-2 py-1 border ${riskColor.replace('text-', 'border-').replace('bg-', 'border-')}`}>
                          {riskCategory.toUpperCase()} RISK
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {(() => {
                        const strategyTypeNum = Number(strategy.strategyType);
                        console.log(`Rendering APY for strategy: ${strategy.name}, type: ${strategy.strategyType} (${typeof strategy.strategyType}), converted: ${strategyTypeNum}, isAave: ${strategyTypeNum === 1}`);
                        return strategyTypeNum === 1 ? ( // StrategyType.Aave
                          // Aave strategy - use real-time APY data
                          <div>
                            <AaveAPYBadge 
                              chainId={strategy.chainId}
                              tokenAddress={strategy.tokenAddress}
                              strategyName={strategy.name}
                              fallbackAPY={formatAPY(strategy.apy, strategy.strategyType)}
                              className="retro-text text-2xl font-bold"
                            />
                            <div className="retro-text-dim text-sm">APY</div>
                          </div>
                        ) : (
                          // Non-Aave strategy - use existing APY data
                          <div>
                            <div className="retro-text text-2xl font-bold">
                              {formatAPY(strategy.apy, strategy.strategyType)}
                            </div>
                            <div className="retro-text-dim text-sm">APY</div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="retro-card p-3">
                      <div className="retro-text-dim text-sm">TVL</div>
                      <div className="retro-text text-lg font-semibold">
                        {formatBalance(strategy.tvl, strategy.tokenAddress, strategy.chainId)} {tokenSymbol}
                      </div>
                    </div>
                    <div className="retro-card p-3">
                      <div className="retro-text-dim text-sm">TOTAL DEPOSITS</div>
                      <div className="retro-text text-lg font-semibold">
                        {formatBalance(strategy.totalDeposits, strategy.tokenAddress, strategy.chainId)} {tokenSymbol}
                      </div>
                    </div>
                    {walletAddress && (
                      <div className="retro-card p-3 border border-retro-border">
                        <div className="retro-text-dim text-sm">YOUR BALANCE</div>
                        <div className="retro-text text-lg font-semibold">
                          {userBalances[strategy.id] || '0.0000'} {tokenSymbol}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="retro-text-dim text-sm">
                      <p>TOKEN: {strategy.tokenAddress.slice(0, 6)}...{strategy.tokenAddress.slice(-4)}</p>
                      <p>STRATEGY: {strategy.strategyAddress.slice(0, 6)}...{strategy.strategyAddress.slice(-4)}</p>
                    </div>
                    
                    <div className="flex space-x-2">
                      {!walletAddress && (
                        <span className="retro-text-dim text-sm">CONNECT WALLET TO INTERACT</span>
                      )}
                      
                      {walletAddress && !isCurrentChain && (
                        <button
                          onClick={() => handleSwitchChain(strategy.chainId)}
                          className="retro-button text-sm font-medium"
                        >
                          SWITCH TO {strategy.chainName.toUpperCase()}
                        </button>
                      )}
                      
                      {walletAddress && isCurrentChain && (
                        <>
                          {activeAction && activeAction.strategyId === strategy.id ? (
                            <div className="flex-1 space-y-3">
                              {/* Approval Status Display */}
                              {activeAction.action === 'deposit' && approvalStatus[strategy.id] && (
                                <div className="retro-text-dim text-xs retro-card p-2">
                                  <div className="flex justify-between items-center">
                                    <div>CURRENT ALLOWANCE: {approvalStatus[strategy.id].allowance} {tokenSymbol}</div>
                                    <button
                                      onClick={() => fetchApprovalStatus()}
                                      disabled={isProcessing}
                                      className="retro-text text-xs underline hover:text-retro-hover"
                                    >
                                      REFRESH
                                    </button>
                                  </div>
                                  {parseFloat(approvalStatus[strategy.id].allowance) < parseFloat(amount || '0') && (
                                    <div className="retro-text font-medium text-orange-400">APPROVAL NEEDED FOR {amount} {tokenSymbol}</div>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={amount}
                                  onChange={handleAmountChange}
                                  className="retro-input flex-1 text-sm"
                                  placeholder="0.0"
                                  disabled={isProcessing}
                                />
                                <button
                                  onClick={handleMaxAmount}
                                  disabled={isProcessing || !userBalances[strategy.id] || parseFloat(userBalances[strategy.id]) <= 0}
                                  className="retro-button text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  MAX
                                </button>
                                <span className="retro-text-dim text-sm">
                                  {tokenSymbol}
                                </span>
                              </div>
                              
                              <div className="flex space-x-2">
                                {activeAction.action === 'deposit' && 
                                 approvalStatus[strategy.id] && 
                                 parseFloat(approvalStatus[strategy.id].allowance) < parseFloat(amount || '0') ? (
                                  // Show approval button first
                                  <button
                                    onClick={() => handleApprove(strategy.id, amount)}
                                    disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
                                    className={`retro-button flex-1 text-sm font-medium ${
                                      !amount || parseFloat(amount) <= 0 || isProcessing
                                        ? 'bg-retro-disabled text-retro-text-dim cursor-not-allowed'
                                        : 'hover:shadow-retro'
                                    }`}
                                  >
                                    {isProcessing ? (
                                      <div className="flex items-center justify-center">
                                        <div className="retro-spinner h-3 w-3 mr-1"></div>
                                        APPROVING...
                                      </div>
                                    ) : (
                                      'APPROVE'
                                    )}
                                  </button>
                                ) : (
                                  // Show deposit/withdraw button
                                  <button
                                    onClick={handleSubmitAction}
                                    disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
                                    className={`retro-button flex-1 text-sm font-medium ${
                                      !amount || parseFloat(amount) <= 0 || isProcessing
                                        ? 'bg-retro-disabled text-retro-text-dim cursor-not-allowed'
                                        : 'hover:shadow-retro'
                                    }`}
                                  >
                                    {isProcessing ? (
                                      <div className="flex items-center justify-center">
                                        <div className="retro-spinner h-3 w-3 mr-1"></div>
                                        PROCESSING...
                                      </div>
                                    ) : (
                                      activeAction.action.toUpperCase()
                                    )}
                                  </button>
                                )}
                                <button
                                  onClick={handleCancelAction}
                                  disabled={isProcessing}
                                  className="retro-button text-sm font-medium disabled:opacity-50"
                                >
                                  CANCEL
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleActionClick(strategy.id, 'deposit')}
                                className="retro-button text-sm font-medium"
                              >
                                DEPOSIT
                              </button>
                              <button 
                                onClick={() => handleActionClick(strategy.id, 'withdraw')}
                                className="retro-button text-sm font-medium"
                              >
                                WITHDRAW
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}


      </div>
    </div>
  );
}; 