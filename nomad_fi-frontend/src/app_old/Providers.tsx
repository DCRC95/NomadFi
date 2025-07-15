"use client";
import * as React from "react";
import { WagmiProvider, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { polygonMumbai, sepolia, type Chain } from "wagmi/chains";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

// Define Polygon Amoy testnet (chainId: 80002)
const polygonAmoy: Chain = {
  id: 80002,
  name: "Polygon Amoy",
  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology"] },
    public: { http: [process.env.NEXT_PUBLIC_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology"] },
  },
  blockExplorers: {
    default: { name: "PolygonScan", url: "https://amoy.polygonscan.com" },
  },
  testnet: true,
};

const hardhat: Chain = {
  id: 31337,
  name: "Hardhat",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
    public: { http: ["http://127.0.0.1:8545"] },
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "" },
  },
  testnet: true,
};

const sepoliaRpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/demo";

export const chains: [Chain, ...Chain[]] = [
  hardhat,
  polygonAmoy,
  { ...sepolia, rpcUrls: { ...sepolia.rpcUrls, default: { http: [sepoliaRpcUrl] }, public: { http: [sepoliaRpcUrl] } } },
];

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_WALLETCONNECT_PROJECT_ID";

export const wagmiConfig = getDefaultConfig({
  appName: "NomadFi",
  projectId,
  chains,
  ssr: true,
  transports: {
    [hardhat.id]: http(),
    [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology"),
    [sepolia.id]: http(sepoliaRpcUrl),
  },
});

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 