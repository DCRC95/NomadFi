"use client";
import React, { useEffect, useState } from "react";
import { useReadContract, useChainId } from "wagmi";
import { YIELD_AGGREGATOR_ABI, MOCK_YIELD_STRATEGY_ABI, CONTRACT_ADDRESSES } from "../src/lib/constants";

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

  return (
    <div className="bg-white rounded-lg shadow p-6 border">
      <div className="text-lg font-semibold mb-2">{info.name}</div>
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

export default function StrategyList() {
  const [strategyIds, setStrategyIds] = useState<string[]>([]);
  // Get the current chainId (default to Hardhat for local dev)
  const chainId = 31337;
  const aggregatorAddress = CONTRACT_ADDRESSES[chainId]?.YieldAggregator as `0x${string}`;

  // Fetch strategyIds
  const {
    data: idsData,
    isLoading: idsLoading,
    error: idsError,
  } = useReadContract({
    address: aggregatorAddress,
    abi: YIELD_AGGREGATOR_ABI,
    functionName: "getAllStrategyIds",
  });

  useEffect(() => {
    if (idsData && Array.isArray(idsData)) {
      setStrategyIds(idsData.map((id) => id.toString()));
    }
  }, [idsData]);

  if (idsLoading) {
    return <div className="p-4 text-center text-gray-500">Loading strategies...</div>;
  }
  if (idsError) {
    return <div className="p-4 text-center text-red-500">Error: {idsError.message}</div>;
  }
  if (!strategyIds.length) {
    return <div className="p-4 text-center text-gray-400">No strategies found.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {strategyIds.map((id, i) => (
        <StrategyCard key={id} aggregatorAddress={aggregatorAddress} strategyId={id} />
      ))}
    </div>
  );
} 