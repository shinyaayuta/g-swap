// gswap/src/components/WalletConnectProvider.tsx

'use client'; // <-- このディレクティブを必ずファイルの先頭に記述してください

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  WalletStandardWalletAdapter, // Standard Wallet に準拠するウォレットを検出するためのアダプター
  // PhantomWalletAdapter, // Phantom は Standard Wallet として検出されるため、明示的な追加は不要とします。
                           // もし検出されない場合は、この行のコメントアウトを解除して試してください。
} from '@solana/wallet-adapter-wallets';

import { SOLANA_RPC_URL } from '../utils/constants'; // <-- RPC URL を constants からインポート

const WalletConnectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 開発中はDevnet、本番はMainnet-betaを設定
  const network = WalletAdapterNetwork.Devnet; 

  // constants.ts で定義された RPC URL を使用
  const endpoint = useMemo(() => SOLANA_RPC_URL, []); 

  // サポートするウォレットアダプターのリストを定義
  const wallets = useMemo(
    () => [
      // Solana Wallet Standard に準拠するウォレット (Phantomを含む) を検出するためのアダプター
      new WalletStandardWalletAdapter({ network }), 
      
      // 他のウォレットアダプターは全て削除します。
      // もし WalletStandardWalletAdapter で Phantom が検出されない場合のみ、
      // ここで new PhantomWalletAdapter({ network }), のコメントアウトを解除してください。

    ],
    [network] // network の変更でアダプターリストを再生成する
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      {/* autoConnect を false に設定し、ユーザーが手動で接続するように促します。 */}
      <WalletProvider wallets={wallets} autoConnect={false}>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WalletConnectProvider;