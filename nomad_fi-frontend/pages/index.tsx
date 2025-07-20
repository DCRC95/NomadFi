import { ConnectButton } from "@rainbow-me/rainbowkit";
import { NewStrategyDashboard } from "../components/NewStrategyDashboard";
import React from "react";

export default function HomePage() {
  console.log('HomePage component rendering...');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">NomadFi Strategy Dashboard</h1>
        <ConnectButton />
      </div>
      
      <NewStrategyDashboard />
    </div>
  );
} 