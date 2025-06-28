// src/app/page.tsx

'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import SwapForm from '../components/SwapForm';
import { Toaster } from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { useWalletBalance } from '../hooks/useWalletBalance'; // useWalletBalanceをインポート
import { useWallet } from '@solana/wallet-adapter-react'; // useWalletをインポート

export default function HomePage() {
  const [isClient, setIsClient] = useState(false);
  const { publicKey } = useWallet(); // ウォレットの公開鍵を取得
  const { balance, loading } = useWalletBalance(); // 残高とローディング状態を取得

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <main className="main-container">
      <h1 className="app-title">gswap</h1>
      <div className="wallet-button-container">
        {isClient && <WalletMultiButton />}
      </div>
      
      {/* 残高表示エリア */}
      {isClient && publicKey && (
        <div className="balance-container">
          {loading ? (
            <p>Loading balance...</p>
          ) : (
            <p>Balance: {balance !== null ? `${balance.toFixed(4)} SOL` : 'N/A'}</p>
          )}
        </div>
      )}

      <SwapForm />
      <Toaster position="bottom-right" />
    </main>
  );
}