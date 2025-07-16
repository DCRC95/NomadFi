import { ConnectButton } from "@rainbow-me/rainbowkit";
import StrategyList from "../components/StrategyList";
import React, { useState, useEffect } from "react";

const RISK_CATEGORIES = ["Very Low", "Low", "Medium", "High", "Very High"];

const CHAIN_NAMES: Record<number, string> = {
  31337: "Hardhat",
  11155111: "Sepolia",
  80002: "Polygon Amoy",
  80001: "Polygon Amoy", // fallback for Amoy
};

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

export default function HomePage() {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string } | null>(null);
  const [selectedRisks, setSelectedRisks] = useState<string[]>([...RISK_CATEGORIES]);

  useEffect(() => {
    setLoading(true);
    fetch('/api/strategies')
      .then(res => res.json())
      .then(data => {
        setStrategies(data);
        setLoading(false);
      })
      .catch(err => {
        setError({ message: err.message || String(err) });
        setLoading(false);
      });
  }, []); // Only on mount

  if (loading) return <div>Loading strategies...</div>;
  if (error) return <div>Error loading strategies: {error.message}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">NomadFi Strategies</h1>
        <ConnectButton />
      </div>
      <RiskFilter selected={selectedRisks} onChange={setSelectedRisks} />
      <StrategyList strategies={strategies || []} filterRiskCategories={selectedRisks} />
    </div>
  );
} 