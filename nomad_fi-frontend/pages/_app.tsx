import "../styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import type { AppProps } from "next/app";
import { WagmiProvider, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { polygonAmoy, sepolia } from "wagmi/chains";

const hardhat = {
  id: 31337,
  name: "Hardhat",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
    public: { http: ["http://127.0.0.1:8545"] },
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://etherscan.io" },
  },
  testnet: true,
};

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";
const amoyRpcUrl = process.env.NEXT_PUBLIC_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";
const sepoliaRpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://ethereum-sepolia.publicnode.com";

const config = getDefaultConfig({
  appName: "PastoralFi",
  projectId,
  chains: [hardhat, polygonAmoy as any, sepolia as any],
  ssr: false,
  transports: {
    [hardhat.id]: http(),
    [polygonAmoy.id]: http(amoyRpcUrl),
    [sepolia.id]: http(sepoliaRpcUrl),
  },
});

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <Component {...pageProps} />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
