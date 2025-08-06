import "../styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import type { AppProps } from "next/app";
import { WagmiProvider, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getDefaultConfig, RainbowKitProvider, Theme } from "@rainbow-me/rainbowkit";

const hardhat = {
  id: 31337,
  name: "Hardhat Network",
  network: "hardhat",
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

const polygonAmoy = {
  id: 80002,
  name: "Polygon Amoy",
  network: "polygon-amoy",
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

const sepolia = {
  id: 11155111,
  name: "Ethereum Sepolia",
  network: "sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://ethereum-sepolia.publicnode.com"] },
    public: { http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://ethereum-sepolia.publicnode.com"] },
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://sepolia.etherscan.io" },
  },
  testnet: true,
};

const baseSepolia = {
  id: 84532,
  name: "Base Sepolia",
  network: "base-sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"] },
    public: { http: [process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"] },
  },
  blockExplorers: {
    default: { name: "BaseScan", url: "https://sepolia.basescan.org" },
  },
  testnet: true,
};

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_WALLETCONNECT_PROJECT_ID";

const config = getDefaultConfig({
  appName: "PastoralFi",
  projectId,
  chains: [hardhat, polygonAmoy, sepolia, baseSepolia], // Include Base Sepolia
  ssr: false,
  transports: {
    [hardhat.id]: http(hardhat.rpcUrls.default.http[0]),
    [polygonAmoy.id]: http(polygonAmoy.rpcUrls.default.http[0]),
    [sepolia.id]: http(sepolia.rpcUrls.default.http[0]),
    [baseSepolia.id]: http(baseSepolia.rpcUrls.default.http[0]),
  },
});

const queryClient = new QueryClient();

// Custom retro-futuristic theme for RainbowKit
const retroTheme: Theme = {
  blurs: {
    modalOverlay: 'blur(0px)',
  },
  colors: {
    accentColor: '#f0f0f0',
    accentColorForeground: '#000000',
    actionButtonBorder: 'rgba(240, 240, 240, 0.2)',
    actionButtonBorderMobile: 'rgba(240, 240, 240, 0.2)',
    actionButtonSecondaryBackground: 'rgba(240, 240, 240, 0.1)',
    closeButton: 'rgba(240, 240, 240, 0.8)',
    closeButtonBackground: 'rgba(0, 0, 0, 0.8)',
    connectButtonBackground: '#000000',
    connectButtonBackgroundError: '#ff494a',
    connectButtonInnerBackground: 'linear-gradient(0deg, rgba(240, 240, 240, 0.1), rgba(240, 240, 240, 0.2))',
    connectButtonText: '#f0f0f0',
    connectButtonTextError: '#ffffff',
    connectionIndicator: '#f0f0f0',
    downloadBottomCardBackground: 'linear-gradient(126deg, rgba(0, 0, 0, 0) 9.49%, rgba(240, 240, 240, 0.1) 71.04%), #000000',
    downloadTopCardBackground: 'linear-gradient(126deg, rgba(240, 240, 240, 0.2) 9.49%, rgba(0, 0, 0, 0) 71.04%), #000000',
    error: '#ff494a',
    generalBorder: 'rgba(240, 240, 240, 0.2)',
    generalBorderDim: 'rgba(240, 240, 240, 0.1)',
    menuItemBackground: 'rgba(240, 240, 240, 0.1)',
    modalBackdrop: 'rgba(0, 0, 0, 0.8)',
    modalBackground: '#0a0a0a',
    modalBorder: 'rgba(240, 240, 240, 0.2)',
    modalText: '#f0f0f0',
    modalTextDim: 'rgba(240, 240, 240, 0.6)',
    modalTextSecondary: 'rgba(240, 240, 240, 0.8)',
    profileAction: '#000000',
    profileActionHover: 'rgba(240, 240, 240, 0.1)',
    profileForeground: 'rgba(240, 240, 240, 0.1)',
    selectedOptionBorder: 'rgba(240, 240, 240, 0.3)',
    standby: '#f0f0f0',
  },
  fonts: {
    body: 'Courier New, monospace',
  },
  radii: {
    actionButton: '0px',
    connectButton: '0px',
    menuButton: '0px',
    modal: '0px',
    modalMobile: '0px',
  },
  shadows: {
    connectButton: '0px 4px 12px rgba(240, 240, 240, 0.3)',
    dialog: '0px 8px 32px rgba(240, 240, 240, 0.3)',
    profileDetailsAction: '0px 2px 6px rgba(240, 240, 240, 0.2)',
    selectedOption: '0px 2px 6px rgba(240, 240, 240, 0.3)',
    selectedWallet: '0px 2px 6px rgba(240, 240, 240, 0.2)',
    walletLogo: '0px 2px 16px rgba(240, 240, 240, 0.3)',
  },
};

export { hardhat, polygonAmoy, sepolia, baseSepolia };

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={retroTheme}>
          <Component {...pageProps} />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
