"use client";
import React, { useEffect, useState } from "react";
import { useReadContract, useChainId, useAccount, useWriteContract, useSwitchChain } from "wagmi";
import { YIELD_AGGREGATOR_ABI, MOCK_YIELD_STRATEGY_ABI, CONTRACT_ADDRESSES, STATIC_PROVIDERS } from "../src/lib/constants";
import { calculateRiskCategory } from "../src/lib/riskUtils";
import { hardhat, polygonAmoy, sepolia } from "../pages/_app";
import { ethers } from "ethers";

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

  return (
    <div className="grid grid-cols-1 gap-6">
      {filteredStrategies.map(strategy => (
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
  const strategyId = strategy.id;
  const isOnCorrectNetwork = Number(connectedChainId) === chainIdNum;

  // Use info directly from strategy prop
  const info = strategy;

  // Calculate risk category
  let riskCategory = "Unknown";
  try {
    riskCategory = calculateRiskCategory(info);
  } catch {}

  const isFiltered = !filterRiskCategories.includes(riskCategory);

  const riskColor =
    riskCategory === "Very Low" || riskCategory === "Low"
      ? "text-green-600 bg-green-100 border-green-300"
      : riskCategory === "Medium"
      ? "text-yellow-700 bg-yellow-100 border-yellow-300"
      : riskCategory === "High" || riskCategory === "Very High"
      ? "text-red-600 bg-red-100 border-red-300"
      : "text-gray-500 bg-gray-100 border-gray-300";

  // User deposit fetching
  const [refreshKey, setRefreshKey] = React.useState(0);
  const { data: userDeposit, refetch: refetchUserDeposit } = useReadContract({
    address: aggregatorAddress,
    abi: YIELD_AGGREGATOR_ABI,
    functionName: "getUserDeposit",
    args: [strategyId, userAddress || "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!userAddress },
  });

  // Deposit/Withdraw state and logic
  const [showForm, setShowForm] = React.useState<"deposit" | "withdraw" | null>(null);
  const [amount, setAmount] = React.useState("");
  const [txState, setTxState] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [txError, setTxError] = React.useState<string | null>(null);
  const { writeContractAsync } = useWriteContract();
  const { chains, switchChain, isPending: isSwitching, error: switchError } = useSwitchChain();
  const [switchSuccess, setSwitchSuccess] = React.useState<string | null>(null);
  const [switchErrorMsg, setSwitchErrorMsg] = React.useState<string | null>(null);

  // Helper: handle deposit/withdraw on current chain
  async function handleTxSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTxState("loading");
    setTxError(null);
    try {
      const fn = showForm === "deposit" ? "deposit" : "withdraw";
      // Convert amount to BigInt using ethers.parseUnits (18 decimals)
      let amountBigInt: bigint;
      try {
        if (!amount || isNaN(Number(amount))) throw new Error("Invalid amount");
        amountBigInt = ethers.parseUnits(amount, 18);
      } catch (parseErr: any) {
        setTxState("error");
        setTxError("Invalid amount format");
        return;
      }
      await writeContractAsync({
        address: aggregatorAddress,
        abi: YIELD_AGGREGATOR_ABI,
        functionName: fn,
        args: [strategyId, amountBigInt],
      });
      if (typeof refetchUserDeposit === "function") {
        await refetchUserDeposit();
      } else {
        setRefreshKey((k) => k + 1);
      }
      setTxState("success");
      setAmount("");
      setShowForm(null);
    } catch (err: any) {
      setTxState("error");
      setTxError(err?.message || "Transaction failed");
    }
  }

  // UI for deposit/withdraw form
  function renderForm() {
    if (isOnCorrectNetwork) {
      return (
        <form className="flex flex-col gap-2 mb-2" onSubmit={handleTxSubmit}>
          <label className="text-sm font-medium">
            Amount
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="block w-full mt-1 px-2 py-1 border rounded focus:outline-none focus:ring focus:border-blue-400"
              placeholder="Enter amount"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              disabled={!amount || Number(amount) <= 0 || txState === "loading"}
            >
              {txState === "loading"
                ? "Confirming..."
                : showForm === "deposit"
                ? "Confirm Deposit"
                : "Confirm Withdraw"}
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
          {txState === "success" && (
            <div className="text-green-600 text-sm mt-1">Success!</div>
          )}
          {txState === "error" && (
            <div className="text-red-600 text-sm mt-1">{txError}</div>
          )}
        </form>
      );
    }
    // If not on the correct chain, show conceptual/cross-chain UI
    return (
      <div className="flex flex-col gap-2 mb-2 border border-yellow-300 bg-yellow-50 p-3 rounded">
        <div className="text-yellow-800 font-semibold mb-1">
          To interact with this strategy, please switch your wallet network to {CHAIN_NAMES[Number(strategy.chainId)] || strategy.chainId} (Chain ID: {strategy.chainId}).
        </div>
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 w-fit"
          onClick={async () => {
            setSwitchSuccess(null);
            setSwitchErrorMsg(null);
            const chainIdNumber = typeof strategy.chainId === "bigint" ? Number(strategy.chainId) : strategy.chainId;
            const chainObj = [hardhat, polygonAmoy, sepolia].find(c => c.id === chainIdNumber);
            if (chainObj) {
              try {
                await switchChain({ chainId: chainObj.id });
                setSwitchSuccess(`Successfully requested switch to ${chainObj.name}`);
              } catch (err: any) {
                setSwitchErrorMsg(err?.message || "SwitchChain error");
              }
            } else {
              setSwitchErrorMsg(`Chain object not found for chainId ${strategy.chainId}`);
            }
          }}
          disabled={isSwitching}
        >
          {isSwitching ? "Switching..." : `Switch Network to ${CHAIN_NAMES[Number(strategy.chainId)] || strategy.chainId}`}
        </button>
        {switchSuccess && <div className="text-green-600 text-sm mt-1">{switchSuccess}</div>}
        {switchErrorMsg && <div className="text-red-600 text-sm mt-1">{switchErrorMsg}</div>}
        {switchError && <div className="text-red-600 text-sm">{switchError.message}</div>}
      </div>
    );
  }

  if (!info || typeof info !== "object" || !("name" in info)) return <div className="p-4 text-center text-red-400">No strategy info found for {strategy.id} on chain {strategy.chainId}. Aggregator address: {String(aggregatorAddress)}</div>;

  return (
    <div className={`bg-white rounded-lg shadow p-6 border ${isFiltered ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-lg font-semibold">{info.name}</div>
        <span className={`px-3 py-1 rounded-full text-sm font-bold border ${riskColor}`}>{riskCategory} Risk</span>
      </div>
      <div className="text-gray-600 mb-1">{info.description}</div>
      <div className="text-sm text-gray-500 mb-1">
        <span className="font-medium">Chain:</span> {CHAIN_NAMES[Number(info.chainId)] || info.chainId}
      </div>
      <div className="text-sm text-gray-500 mb-1">
        <span className="font-medium">APY:</span> <span className="text-green-600 font-semibold">{info.apy ? `${Number(info.apy) / 100}%` : 'N/A'}</span>
      </div>
      <div className="text-xs text-gray-400 mb-2">
        <span className="font-medium">Address:</span> {info.strategyAddress}
      </div>
      <div className="flex items-center gap-4 mb-2">
        <div className="text-sm font-medium">Your Deposit:</div>
        <div className="text-sm text-blue-700 font-mono">{userDeposit ? userDeposit.toString() : "0"}</div>
      </div>
      <div className="flex gap-2 mb-2">
        <button
          className={`px-3 py-1 ${showForm === "deposit" ? "bg-blue-200" : "bg-blue-100"} text-blue-700 rounded hover:bg-blue-200 border border-blue-300`}
          onClick={() => {
            setShowForm(showForm === "deposit" ? null : "deposit");
            setTxError(null);
            if (showForm !== "deposit") setTxState("idle");
          }}
        >
          Deposit
        </button>
        <button
          className={`px-3 py-1 ${showForm === "withdraw" ? "bg-gray-200" : "bg-gray-100"} text-gray-700 rounded hover:bg-gray-200 border border-gray-300`}
          onClick={() => {
            setShowForm(showForm === "withdraw" ? null : "withdraw");
            setTxError(null);
            if (showForm !== "withdraw") setTxState("idle");
          }}
        >
          Withdraw
        </button>
      </div>
      {showForm === null && txState === "success" && (
        <div className="text-green-600 text-sm mb-2">Success!</div>
      )}
      {showForm && renderForm()}
      {isFiltered && (
        <div className="absolute top-2 right-2 bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs font-bold">Filtered</div>
      )}
    </div>
  );
} 