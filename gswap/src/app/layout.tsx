// gswap/src/app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { WalletConnectProvider } from '../components/WalletConnectProvider'; // <-- 正しいパスとコンポーネント名

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'gswap',
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
        <WalletConnectProvider> 
          {children}
        </WalletConnectProvider>
      </body>
    </html>
  );
}