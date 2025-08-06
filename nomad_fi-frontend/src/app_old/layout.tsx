import "../styles/globals.css";
import type { Metadata } from "next";
import ClientRoot from "./ClientRoot";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
