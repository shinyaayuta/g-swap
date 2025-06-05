// src/components/WalletConnectProvider.tsx

'use client';

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

const WalletConnectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 開発中はDevnet、本番はMainnet-betaを設定
  const network = WalletAdapterNetwork.Devnet; // または WalletAdapterNetwork.MainnetBeta;

  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(), // Phantomウォレットを使用
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WalletConnectProvider;