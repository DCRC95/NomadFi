import "./globals.css";
import type { Metadata } from "next";
import Providers from "./Providers";
import ConnectWalletButton from "@/components/ConnectWalletButton";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <Providers>
          <header className="w-full h-16 flex items-center justify-between px-8 border-b bg-white/80 shadow-sm">
            <div className="text-xl font-bold">NomadFi</div>
            <ConnectWalletButton />
          </header>
          <main className="max-w-3xl mx-auto p-4 w-full">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
