// src/app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import WalletConnectProvider from '../components/WalletConnectProvider'; // <--- 追加

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Solana Swap App',
  description: 'A decentralized token swap application on Solana',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* WalletConnectProviderでアプリケーション全体をラップ */}
        <WalletConnectProvider> 
          {children}
        </WalletConnectProvider>
      </body>
    </html>
  );
}