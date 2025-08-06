import { ConnectButton } from "@rainbow-me/rainbowkit";
import { NewStrategyDashboard } from "../components/NewStrategyDashboard";
import { PositionsHistory } from "../components/PositionsHistory";
import Footer from "../components/Footer";
import React from "react";

export default function AppPage() {
  console.log('AppPage component rendering...');
  
  return (
    <div className="h-screen bg-retro-darker flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex-1">
              <h1 className="retro-text text-4xl font-bold mb-2">
                NOMADFI TERMINAL v1.0.0
              </h1>
              <div className="retro-text-dim text-sm">
                <span className="terminal-cursor">SYSTEM STATUS: ONLINE</span>
              </div>
            </div>
            <div className="retro-card p-2">
              <ConnectButton />
            </div>
          </div>
          
          <div className="retro-card p-6 mb-6">
            <div className="retro-text text-sm mb-2">
              <span className="text-retro-text-dim">{'>'}</span> INITIALIZING STRATEGY DASHBOARD...
            </div>
            <div className="retro-text text-sm">
              <span className="text-retro-text-dim">{'>'}</span> LOADING MULTI-CHAIN DATA...
            </div>
          </div>
        </div>
      </div>
      
      {/* Scrollable Content Area */}
      <div className="flex-1 flex overflow-hidden">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-6 h-full">
          {/* Left column - Strategy Dashboard (takes 2/3 of space on desktop, full width on mobile) */}
          <div className="w-full lg:w-2/3 h-full overflow-y-auto">
            <NewStrategyDashboard />
          </div>
          
          {/* Right column - Positions & History (takes 1/3 of space on desktop, full width on mobile) */}
          <div className="w-full lg:w-1/3 h-full overflow-y-auto">
            <PositionsHistory />
          </div>
        </div>
      </div>
      
      {/* Fixed Footer */}
      <div className="flex-shrink-0">
        <Footer />
      </div>
    </div>
  );
} 