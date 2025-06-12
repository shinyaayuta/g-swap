// gswap/src/components/WalletConnectProvider.tsx

"use client"; // Client Componentとしてマーク

import React, { useMemo, ReactNode } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js'; // clusterApiUrl を使用
import { SOLANA_RPC_URL } from '../utils/constants';

// ここでPhantomWalletAdapterとSolflareWalletAdapterをインポート
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'; 
// 他にサポートしたいウォレットがあればここに追加

interface WalletConnectProviderProps { // コンポーネント名を合わせる
  children: ReactNode;
}

export function WalletConnectProvider({ children }: WalletConnectProviderProps) { // コンポーネント名を合わせる
  const network = WalletAdapterNetwork.Devnet; // Devnet, Testnet, Mainnet-beta
  const endpoint = useMemo(() => SOLANA_RPC_URL, []);// clusterApiUrl を使用

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(), // Phantom ウォレットを追加
      new SolflareWalletAdapter({ network }), // Solflare ウォレットを追加
      // 必要に応じて他のウォレットアダプターを追加
    ],
    [network] // network が変更された場合にウォレットリストを再生成
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      {/* autoConnect は true のままでも良いですが、ハイドレーションエラーが出やすい場合は false を検討 */}
      <WalletProvider wallets={wallets} autoConnect> 
        <WalletModalProvider> {/* ウォレット選択モーダルのためのプロバイダー */}
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}