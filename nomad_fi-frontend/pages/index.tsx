import { ConnectButton } from "@rainbow-me/rainbowkit";
import StrategyList from "../components/StrategyList";

export default function Home() {
  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">PastoralFi Dashboard</h1>
        <ConnectButton />
      </header>
      <StrategyList />
    </main>
  );
} 