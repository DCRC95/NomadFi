"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function ConnectWalletButton() {
  return (
    <div className="flex justify-center items-center py-4">
      <div className="retro-card p-2">
        <ConnectButton />
      </div>
    </div>
  );
} 