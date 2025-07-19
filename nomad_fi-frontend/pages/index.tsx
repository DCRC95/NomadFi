import { ConnectButton } from "@rainbow-me/rainbowkit";
import StrategyList from "../components/StrategyList";
import React, { useState, useEffect } from "react";
import { sepolia } from "wagmi/chains";
import {
  aaveYieldStrategyAbi,
  yieldAggregatorAbi,
} from "../src/generated";
import {
  aaveYieldStrategyAddress,
  yieldAggregatorAddress,
} from "../src/contractAddresses";
import { useReadContract, useWatchContractEvent } from "wagmi";
import type { Log } from "viem";

// Helper function to convert BigInt values to strings for JSON serialization
function convertBigIntToString(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = convertBigIntToString(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
}

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
  const [transactionHistory, setTransactionHistory] = useState<Log[]>([]);

  // Contract reads
  const { data: underlyingToken } = useReadContract({
    address: aaveYieldStrategyAddress[sepolia.id],
    abi: aaveYieldStrategyAbi,
    functionName: "underlyingToken",
    chainId: sepolia.id,
  });

  const { data: owner } = useReadContract({
    address: yieldAggregatorAddress[sepolia.id],
    abi: yieldAggregatorAbi,
    functionName: "owner",
    chainId: sepolia.id,
  });

  // Event listeners
  useWatchContractEvent({
    address: yieldAggregatorAddress[sepolia.id],
    abi: yieldAggregatorAbi,
    eventName: "Deposit",
    chainId: sepolia.id,
    onLogs: (logs: Log[]) => {
      setTransactionHistory((prev) => {
        const newLogs = logs.filter(
          (log) => !prev.some((l) => l.transactionHash === log.transactionHash)
        );
        return [...newLogs, ...prev];
      });
    },
  });

  useWatchContractEvent({
    address: yieldAggregatorAddress[sepolia.id],
    abi: yieldAggregatorAbi,
    eventName: "Withdrawal",
    chainId: sepolia.id,
    onLogs: (logs: Log[]) => {
      setTransactionHistory((prev) => {
        const newLogs = logs.filter(
          (log) => !prev.some((l) => l.transactionHash === log.transactionHash)
        );
        return [...newLogs, ...prev];
      });
    },
  });

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
      {/* Contract info section */}
      <div className="mb-6 p-4 border rounded bg-gray-50">
        <div><strong>AAVEYieldStrategy underlyingToken:</strong> {underlyingToken as string}</div>
        <div><strong>YieldAggregator owner:</strong> {owner as string}</div>
      </div>
      {/* Transaction history section */}
      <div className="mb-6 p-4 border rounded bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Transaction History (Deposit & Withdrawal Events)</h2>
        <ul>
          {transactionHistory.length === 0 && <li className="text-gray-500">No events yet.</li>}
          {transactionHistory.map((log, idx) => (
            <li key={(log.transactionHash ?? "nohash") + idx} className="mb-2">
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">{JSON.stringify(convertBigIntToString(log), null, 2)}</pre>
            </li>
          ))}
        </ul>
      </div>
      <RiskFilter selected={selectedRisks} onChange={setSelectedRisks} />
      <StrategyList strategies={strategies || []} filterRiskCategories={selectedRisks} />
    </div>
  );
} 