"use client";
import React, { useEffect, useState } from "react";
import { useReadContract, useChainId } from "wagmi";
import { YIELD_AGGREGATOR_ABI, MOCK_YIELD_STRATEGY_ABI, CONTRACT_ADDRESSES } from "../src/lib/constants";
import { calculateRiskCategory } from "../src/lib/riskUtils";

const CHAIN_NAMES: Record<number, string> = {
  31337: "Hardhat Network",
  11155111: "Sepolia",
  80002: "Polygon Amoy",
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
  // Only fetch APY if on the correct chain
  const shouldFetch = connectedChainId === strategyChainId;
  if (!shouldFetch) return <span className="text-gray-400">Switch network to view APY</span>;
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
    // APY is uint256, e.g., 500 = 5%
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
  strategyIds: string[];
  filterRiskCategories: string[];
}

export default function StrategyList({ strategyIds, filterRiskCategories }: StrategyListProps) {
  // Get the current chainId (default to Hardhat for local dev)
  const chainId = 31337;
  const aggregatorAddress = CONTRACT_ADDRESSES[chainId]?.YieldAggregator as `0x${string}`;

  if (!strategyIds.length) {
    return <div className="p-4 text-center text-gray-400">No strategies found.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {strategyIds.map((id) => (
        <StrategyCardWithFilter
          key={id}
          aggregatorAddress={aggregatorAddress}
          strategyId={id}
          filterRiskCategories={filterRiskCategories}
        />
      ))}
    </div>
  );
}

function StrategyCardWithFilter({ aggregatorAddress, strategyId, filterRiskCategories }: { aggregatorAddress: `0x${string}`; strategyId: string; filterRiskCategories: string[] }) {
  const { data, isLoading, error } = useReadContract({
    address: aggregatorAddress,
    abi: YIELD_AGGREGATOR_ABI,
    functionName: "getStrategyInfo",
    args: [strategyId],
  });
  const info = data as StrategyInfo;

  if (isLoading) return null;
  if (error) return null;
  if (!info || typeof info !== "object" || !("name" in info)) return null;

  // Calculate risk category
  let riskCategory = "Unknown";
  try {
    riskCategory = calculateRiskCategory(info);
  } catch {}

  if (!filterRiskCategories.includes(riskCategory)) return null;

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