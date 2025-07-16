"use client";
import React, { useState } from "react";
import StrategyList from "../components/StrategyList";
import { CONTRACT_ADDRESSES, YIELD_AGGREGATOR_ABI } from "../src/lib/constants";
import { useReadContract } from "wagmi";

export default function HomePage() {
  // Hardhat chain for local dev
  const chainId = 31337;
  const aggregatorAddress = CONTRACT_ADDRESSES[chainId]?.YieldAggregator as `0x${string}`;

  // Fetch all strategy IDs from the contract
  const { data: strategyIdsData, isLoading } = useReadContract({
    address: aggregatorAddress,
    abi: YIELD_AGGREGATOR_ABI,
    functionName: "getAllStrategyIds",
  });

  // Show all risk categories by default
  const allRiskCategories = ["Very Low", "Low", "Medium", "High", "Very High"];
  const [selectedRiskCategories, setSelectedRiskCategories] = useState<string[]>(allRiskCategories);

  // Convert strategyIdsData to string[]
  const strategyIds = Array.isArray(strategyIdsData)
    ? strategyIdsData.map((id) => id.toString())
    : [];

  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Available Strategies</h1>
      {/* Risk filter UI */}
      <div className="flex gap-4 justify-center mb-6">
        {allRiskCategories.map((cat) => (
          <label key={cat} className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={selectedRiskCategories.includes(cat)}
              onChange={() => {
                setSelectedRiskCategories((prev) =>
                  prev.includes(cat)
                    ? prev.filter((c) => c !== cat)
                    : [...prev, cat]
                );
              }}
            />
            {cat}
          </label>
        ))}
      </div>
      {isLoading ? (
        <div className="text-center text-gray-400">Loading strategies...</div>
      ) : (
        <StrategyList strategies={strategyIds} filterRiskCategories={selectedRiskCategories} />
      )}
    </main>
  );
} 