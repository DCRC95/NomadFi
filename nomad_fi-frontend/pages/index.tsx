import { ConnectButton } from "@rainbow-me/rainbowkit";
import StrategyList from "../components/StrategyList";
import React, { useState } from "react";
import { useReadContract } from "wagmi";
import { YIELD_AGGREGATOR_ABI, CONTRACT_ADDRESSES } from "../src/lib/constants";
import { calculateRiskCategory } from "../src/lib/riskUtils";

const RISK_CATEGORIES = ["Very Low", "Low", "Medium", "High", "Very High"];

function RiskFilter({ selected, onChange }: { selected: string[]; onChange: (val: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-4 mb-6 items-center justify-center">
      {RISK_CATEGORIES.map((cat) => (
        <label key={cat} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(cat)}
            onChange={() =>
              selected.includes(cat)
                ? onChange(selected.filter((c) => c !== cat))
                : onChange([...selected, cat])
            }
            className="accent-blue-600"
          />
          <span className="text-sm font-medium">{cat} Risk</span>
        </label>
      ))}
    </div>
  );
}

export default function Home() {
  const [selectedRisks, setSelectedRisks] = useState<string[]>(["Very Low", "Low", "Medium", "High", "Very High"]);
  // Get all strategy IDs from the contract
  const chainId = 31337;
  const aggregatorAddress = CONTRACT_ADDRESSES[chainId]?.YieldAggregator as `0x${string}`;
  const { data: idsData } = useReadContract({
    address: aggregatorAddress,
    abi: YIELD_AGGREGATOR_ABI,
    functionName: "getAllStrategyIds",
  });
  const strategyIds = Array.isArray(idsData) ? idsData.map((id) => id.toString()) : [];

  // Filtering logic will be handled in StrategyList via prop
  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">PastoralFi Dashboard</h1>
        <ConnectButton />
      </header>
      <RiskFilter selected={selectedRisks} onChange={setSelectedRisks} />
      <StrategyList filterRiskCategories={selectedRisks} strategyIds={strategyIds} />
    </main>
  );
} 