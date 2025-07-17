"use client";
import React, { useEffect, useState } from "react";
import { useReadContract, useChainId, useAccount, useWriteContract, useSwitchChain, useBalance, useWaitForTransactionReceipt } from "wagmi";
import { YIELD_AGGREGATOR_ABI, MOCK_YIELD_STRATEGY_ABI, CONTRACT_ADDRESSES, STATIC_PROVIDERS } from "../src/lib/constants";
import { calculateRiskCategory } from "../src/lib/riskUtils";
import { hardhat, polygonAmoy, sepolia } from "../pages/_app";
import { ethers } from "ethers";
import MockERC20Abi from "../src/abi/MockERC20.json";

const CHAIN_NAMES: Record<number, string> = {
  [hardhat.id]: hardhat.name,
  [polygonAmoy.id]: polygonAmoy.name,
  [sepolia.id]: sepolia.name,
};

type StrategyInfo = {
  name: string;
  description: string;
  baseRiskScore: number;
  chainId: number;
  strategyAddress: `0x${string}`;
};

function StrategyAPY({ strategyAddress, strategyChainId }: { strategyAddress: `0x${string}`; strategyChainId: number }) {
  const connectedChainId = useChainId();
  // Ensure both are numbers for strict comparison
  const shouldFetch = Number(connectedChainId) === Number(strategyChainId);

  if (!shouldFetch) {
    return <span className="text-gray-400">Switch network to view APY</span>;
  }

  const {
    data: apyData,
    isLoading,
    error,
  } = useReadContract({
    address: strategyAddress,
    abi: MOCK_YIELD_STRATEGY_ABI,
    functionName: "getAPY",
  });

  if (isLoading) return <span className="text-gray-400">Loading APY...</span>;
  if (error) return <span className="text-red-400">Error</span>;
  if (apyData !== undefined) {
    const apy = Number(apyData) / 100;
    return <span className="text-green-600 font-semibold">{apy}%</span>;
  }
  return <span className="text-gray-400">N/A</span>;
}

function StrategyCard({ aggregatorAddress, strategyId }: { aggregatorAddress: `0x${string}`; strategyId: string }) {
  const { data, isLoading, error } = useReadContract({
    address: aggregatorAddress,
    abi: YIELD_AGGREGATOR_ABI,
    functionName: "getStrategyInfo",
    args: [strategyId],
  });
  const info = data as StrategyInfo;

  if (isLoading) return <div className="p-4 text-center text-gray-400">Loading strategy info...</div>;
  if (error) return <div className="p-4 text-center text-red-400">Error loading strategy info</div>;
  if (!info || typeof info !== "object" || !("name" in info)) return null;

  // Calculate risk category
  let riskCategory = "Unknown";
  try {
    riskCategory = calculateRiskCategory(info);
  } catch {}

  // Colour classes for risk
  const riskColor =
    riskCategory === "Very Low" || riskCategory === "Low"
      ? "text-green-600 bg-green-100 border-green-300"
      : riskCategory === "Medium"
      ? "text-yellow-700 bg-yellow-100 border-yellow-300"
      : riskCategory === "High" || riskCategory === "Very High"
      ? "text-red-600 bg-red-100 border-red-300"
      : "text-gray-500 bg-gray-100 border-gray-300";

  return (
    <div className="bg-white rounded-lg shadow p-6 border">
      <div className="flex items-center justify-between mb-2">
        <div className="text-lg font-semibold">{info.name}</div>
        <span className={`px-3 py-1 rounded-full text-sm font-bold border ${riskColor}`}>{riskCategory} Risk</span>
      </div>
      <div className="text-gray-600 mb-1">{info.description}</div>
      <div className="text-sm text-gray-500 mb-1">
        <span className="font-medium">Chain:</span> {CHAIN_NAMES[info.chainId] || info.chainId}
      </div>
      <div className="text-sm text-gray-500 mb-1">
        <span className="font-medium">APY:</span> <StrategyAPY strategyAddress={info.strategyAddress} strategyChainId={info.chainId} />
      </div>
      <div className="text-xs text-gray-400">
        <span className="font-medium">Address:</span> {info.strategyAddress}
      </div>
    </div>
  );
}

interface StrategyListProps {
  strategies: { id: string; chainId: number }[];
  filterRiskCategories: string[];
}

type YieldStrategy = {
  id: string;
  chainId: number;
  name: string;
  description: string;
  baseRiskScore: number | string;
  strategyAddress: string;
  [key: string]: any;
};

export default function StrategyList({ strategies, filterRiskCategories }: StrategyListProps) {
  // Only filter if every strategy has the required fields
  const canFilter = Array.isArray(strategies) && strategies.length > 0 && strategies.every(s =>
    s && typeof s === 'object' && 'baseRiskScore' in s && 'name' in s && 'strategyAddress' in s
  );

  const filteredStrategies = canFilter
    ? (strategies as YieldStrategy[]).filter(strategy => {
        let riskCategory = "Unknown";
        try {
          // Ensure baseRiskScore is a number for risk calculation
          const safeStrategy = {
            ...strategy,
            baseRiskScore: typeof strategy.baseRiskScore === 'string' ? Number(strategy.baseRiskScore) : strategy.baseRiskScore,
          };
          riskCategory = calculateRiskCategory(safeStrategy);
        } catch {}
        return filterRiskCategories.includes(riskCategory);
      })
    : strategies;

  const safeFilteredStrategies = Array.isArray(filteredStrategies) ? filteredStrategies : [];

  return (
    <div className="grid grid-cols-1 gap-6">
      {safeFilteredStrategies.map(strategy => (
        <StrategyCardWithFilter
          key={strategy.id + '-' + strategy.chainId}
          strategy={strategy}
          filterRiskCategories={filterRiskCategories}
        />
      ))}
    </div>
  );
}

function StrategyCardWithFilter({ strategy, filterRiskCategories }: { strategy: any; filterRiskCategories: string[] }) {
  const { address: userAddress } = useAccount();
  const connectedChainId = useChainId();
  const chainIdNum = Number(strategy.chainId);
  const aggregatorAddress = CONTRACT_ADDRESSES[chainIdNum]?.YieldAggregator as `0x${string}`;
  const mockErc20Address = CONTRACT_ADDRESSES[chainIdNum]?.MockERC20 as `0x${string}`;
  const strategyId = strategy.id;
  const isOnCorrectNetwork = Number(connectedChainId) === chainIdNum;

  // Fetch user's MockERC20 balance for the strategy's chain
  const { data: mockTokenBalance, isLoading: isBalanceLoading, error: balanceError } = useBalance({
    address: userAddress,
    token: mockErc20Address,
    chainId: chainIdNum,
  });

  // Fetch user's deposited balance in the aggregator for this strategy
  const { data: depositedAmount, isLoading: isDepositLoading, error: depositedAmountError } = useReadContract({
    address: aggregatorAddress,
    abi: YIELD_AGGREGATOR_ABI,
    functionName: "userDeposits",
    args: [userAddress, mockErc20Address, strategyId],
  });

  // Approval logic
  const { data: allowance, refetch: refetchAllowance, isLoading: isAllowanceLoading } = useReadContract({
    abi: MockERC20Abi.abi,
    address: mockErc20Address,
    functionName: "allowance",
    args: [userAddress, aggregatorAddress],
  });

  const { writeContract: writeApprove, data: approveHash, isPending: isApproving, isSuccess: isApproveSuccess, error: approveError } = useWriteContract();
  const { isLoading: isConfirmingApproval, isSuccess: isApprovalConfirmed } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Deposit/Withdraw state and logic
  const [showForm, setShowForm] = React.useState<"deposit" | "withdraw" | null>(null);
  const [amount, setAmount] = React.useState("");
  const [txState, setTxState] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [txError, setTxError] = React.useState<string | null>(null);
  const { writeContractAsync, writeContract } = useWriteContract();

  // Deposit transaction logic
  const { writeContract: writeDeposit, data: depositHash, isPending: isDepositing, isSuccess: isDepositSuccess, error: depositError } = useWriteContract();
  const { isLoading: isConfirmingDeposit, isSuccess: isDepositConfirmed } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  // Withdraw transaction logic
  const [withdrawAmount, setWithdrawAmount] = React.useState("");
  const { writeContract: writeWithdraw, data: withdrawHash, isPending: isWithdrawing, isSuccess: isWithdrawSuccess, error: withdrawError } = useWriteContract();
  const { isLoading: isConfirmingWithdraw, isSuccess: isWithdrawConfirmed } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  // Refetch hooks for balance and deposited amount
  const { refetch: refetchMockTokenBalance } = useBalance({
    address: userAddress,
    token: mockErc20Address,
    chainId: chainIdNum,
  });
  const { refetch: refetchDepositedAmount } = useReadContract({
    address: aggregatorAddress,
    abi: YIELD_AGGREGATOR_ABI,
    functionName: "userDeposits",
    args: [userAddress, mockErc20Address, strategyId],
  });

  // Deposit handler
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxState("loading");
    setTxError(null);
    let amountBigInt: bigint;
    try {
      if (!amount || isNaN(Number(amount))) throw new Error("Invalid amount");
      amountBigInt = ethers.parseUnits(amount, 18);
    } catch (parseErr: any) {
      setTxState("error");
      setTxError("Invalid amount format");
      return;
    }
    try {
      await writeDeposit({
        address: aggregatorAddress,
        abi: YIELD_AGGREGATOR_ABI,
        functionName: "deposit",
        args: [mockErc20Address, amountBigInt, strategyId],
      });
    } catch (err: any) {
      setTxState("error");
      setTxError(err?.message || "Transaction failed");
      return;
    }
    setTxState("success");
    setAmount("");
    setShowForm(null);
    // Refetch balances after deposit
    refetchMockTokenBalance && refetchMockTokenBalance();
    refetchDepositedAmount && refetchDepositedAmount();
  };

  // Withdraw handler
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxState("loading");
    setTxError(null);
    let withdrawAmountBigInt: bigint;
    try {
      if (!withdrawAmount || isNaN(Number(withdrawAmount))) throw new Error("Invalid amount");
      withdrawAmountBigInt = ethers.parseUnits(withdrawAmount, 18);
    } catch (parseErr: any) {
      setTxState("error");
      setTxError("Invalid amount format");
      return;
    }
    try {
      await writeWithdraw({
        address: aggregatorAddress,
        abi: YIELD_AGGREGATOR_ABI,
        functionName: "withdraw",
        args: [mockErc20Address, withdrawAmountBigInt, strategyId],
      });
    } catch (err: any) {
      setTxState("error");
      setTxError(err?.message || "Transaction failed");
      return;
    }
    setTxState("success");
    setWithdrawAmount("");
    setShowForm(null);
    // Refetch balances after withdrawal
    refetchMockTokenBalance && refetchMockTokenBalance();
    refetchDepositedAmount && refetchDepositedAmount();
  };

  // Calculate risk category
  let riskCategory = "Unknown";
  try {
    riskCategory = calculateRiskCategory(strategy);
  } catch {}

  const riskColor =
    riskCategory === "Very Low" || riskCategory === "Low"
      ? "text-green-600 bg-green-100 border-green-300"
      : riskCategory === "Medium"
      ? "text-yellow-700 bg-yellow-100 border-yellow-300"
      : riskCategory === "High" || riskCategory === "Very High"
      ? "text-red-600 bg-red-100 border-red-300"
      : "text-gray-500 bg-gray-100 border-gray-300";

  // Parse amount to BigInt for comparison
  let parsedAmount: bigint = BigInt(0);
  try {
    parsedAmount = amount ? ethers.parseUnits(amount, 18) : BigInt(0);
  } catch {}
  const needsApproval =
    allowance != null &&
    (typeof allowance === "string" || typeof allowance === "number" || typeof allowance === "bigint") &&
    parsedAmount > 0 &&
    BigInt(allowance) < parsedAmount;

  // Parse withdrawAmount to BigInt for comparison
  let withdrawAmountBigInt: bigint = BigInt(0);
  try {
    withdrawAmountBigInt = withdrawAmount ? ethers.parseUnits(withdrawAmount, 18) : BigInt(0);
  } catch {}
  const depositedAmountNum =
    (typeof depositedAmount === "bigint" || typeof depositedAmount === "number" || typeof depositedAmount === "string")
      ? BigInt(depositedAmount)
      : BigInt(0);
  const disableWithdraw = !userAddress || !withdrawAmount || Number(withdrawAmount) <= 0 || withdrawAmountBigInt > depositedAmountNum || isWithdrawing || isConfirmingWithdraw;

  // Approve handler
  const handleApprove = async () => {
    try {
      await writeApprove({
        abi: MockERC20Abi.abi,
        address: mockErc20Address,
        functionName: "approve",
        args: [aggregatorAddress, ethers.MaxUint256],
      });
    } catch (err) {
      // error handled by wagmi
    }
  };

  // UI for deposit/withdraw form
  function renderForm() {
    return (
      <>
        {/* Wallet balance display */}
        <div className="mb-2 text-sm">
          <span className="font-medium">Wallet Balance:</span>{" "}
          {isBalanceLoading && <span className="text-gray-400">Loading...</span>}
          {balanceError && <span className="text-red-400">Error</span>}
          {mockTokenBalance && (
            <span className="text-blue-700 font-mono">{mockTokenBalance.formatted} {mockTokenBalance.symbol}</span>
          )}
        </div>
        {/* User's deposited balance display */}
        <div className="mb-2 text-sm">
          <span className="font-medium">Deposited in Aggregator:</span>{" "}
          {isDepositLoading && <span className="text-gray-400">Loading...</span>}
          {depositedAmountError && <span className="text-red-400">Error</span>}
          {(typeof depositedAmount === "string" || typeof depositedAmount === "number" || typeof depositedAmount === "bigint") && (
            <span className="text-green-700 font-mono">{ethers.formatUnits(depositedAmount, 17)}</span>
          )}
        </div>
        {/* Approval UI */}
        <div className="mb-2 text-sm">
          {isAllowanceLoading ? (
            <span className="text-gray-400">Checking allowance...</span>
          ) : needsApproval ? (
            <button
              type="button"
              onClick={handleApprove}
              disabled={isApproving || isConfirmingApproval}
              className="px-3 py-1 bg-yellow-500 text-white rounded"
            >
              {isApproving || isConfirmingApproval ? "Approving..." : "Approve Token"}
            </button>
          ) : null}
          {isApproveSuccess && <span className="text-green-600 ml-2">Approval transaction sent!</span>}
          {approveError && <span className="text-red-600 ml-2">{approveError.message}</span>}
        </div>
        {/* Deposit form */}
        <form className="flex flex-col gap-2 mb-2" onSubmit={handleDeposit}>
          <label className="text-sm font-medium">
            Amount
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={e => setAmount(String(e.target.value))}
              className="block w-full mt-1 px-2 py-1 border rounded focus:outline-none focus:ring focus:border-blue-400"
              placeholder="Enter amount"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              disabled={!userAddress || !amount || Number(amount) <= 0 || needsApproval || isDepositing || isConfirmingDeposit}
            >
              {isDepositing || isConfirmingDeposit
                ? "Depositing..."
                : "Confirm Deposit"}
            </button>
            <button
              type="button"
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              onClick={() => {
                setShowForm(null);
                setTxState("idle");
                setTxError(null);
                setAmount("");
              }}
            >
              Cancel
            </button>
          </div>
          {isDepositSuccess && <div className="text-green-600 text-sm mt-1">Deposit transaction sent!</div>}
          {depositError && <div className="text-red-600 text-sm mt-1">{depositError.message}</div>}
          {txState === "success" && (
            <div className="text-green-600 text-sm mt-1">Success!</div>
          )}
          {txState === "error" && (
            <div className="text-red-600 text-sm mt-1">{txError}</div>
          )}
        </form>
        {/* Withdraw form */}
        <form className="flex flex-col gap-2 mb-2" onSubmit={handleWithdraw}>
          <label className="text-sm font-medium">
            Withdraw Amount
            <input
              type="number"
              min="0"
              step="any"
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(String(e.target.value))}
              className="block w-full mt-1 px-2 py-1 border rounded focus:outline-none focus:ring focus:border-blue-400"
              placeholder="Enter amount to withdraw"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-800"
              disabled={disableWithdraw}
            >
              {isWithdrawing || isConfirmingWithdraw
                ? "Withdrawing..."
                : "Confirm Withdraw"}
            </button>
            <button
              type="button"
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              onClick={() => {
                setShowForm(null);
                setTxState("idle");
                setTxError(null);
                setWithdrawAmount("");
              }}
            >
              Cancel
            </button>
          </div>
          {isWithdrawSuccess && <div className="text-green-600 text-sm mt-1">Withdraw transaction sent!</div>}
          {withdrawError && <div className="text-red-600 text-sm mt-1">{withdrawError.message}</div>}
          {txState === "success" && (
            <div className="text-green-600 text-sm mt-1">Success!</div>
          )}
          {txState === "error" && (
            <div className="text-red-600 text-sm mt-1">{txError}</div>
          )}
        </form>
      </>
    );
  }

  if (!strategy || typeof strategy !== "object" || !("name" in strategy)) return <div className="p-4 text-center text-red-400">No strategy info found for {strategy.id} on chain {strategy.chainId}. Aggregator address: {String(aggregatorAddress)}</div>;

  return (
    <div className={`bg-white rounded-lg shadow p-6 border`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-lg font-semibold">
          {strategy.name}
          {strategy.name && strategy.name.toLowerCase().includes("aave") && (
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">Aave</span>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-bold border ${riskColor}`}>{riskCategory} Risk</span>
      </div>
      <div className="text-gray-600 mb-1">{strategy.description}</div>
      <div className="text-sm text-gray-500 mb-1">
        <span className="font-medium">Chain:</span> {CHAIN_NAMES[Number(strategy.chainId)] || strategy.chainId}
      </div>
      <div className="text-sm text-gray-500 mb-1">
        <span className="font-medium">APY:</span> <span className="text-green-600 font-semibold">{strategy.apy ? `${Number(strategy.apy) / 100}%` : 'N/A'}</span>
      </div>
      {/* Aave-specific details */}
      {strategy.name && strategy.name.toLowerCase().includes("aave") && (
        <div className="text-xs text-blue-900 bg-blue-50 rounded p-2 mb-2">
          <div><span className="font-medium">Underlying Token:</span> {strategy.underlyingToken || <span className="text-gray-400">N/A</span>}</div>
          <div><span className="font-medium">aToken:</span> {strategy.aToken || <span className="text-gray-400">N/A</span>}</div>
          <div><span className="font-medium">Current Balance:</span> {strategy.currentBalance !== null && strategy.currentBalance !== undefined ? strategy.currentBalance : <span className="text-gray-400">N/A</span>}</div>
        </div>
      )}
      <div className="text-xs text-gray-400 mb-2">
        <span className="font-medium">Address:</span> {strategy.strategyAddress}
      </div>
      {renderForm()}
    </div>
  );
} 