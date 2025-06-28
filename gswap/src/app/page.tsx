// src/app/page.tsx

'use client';

import dynamic from 'next/dynamic'; // ★ next/dynamicをインポート
// import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'; // ★ この行は削除またはコメントアウト

import SwapForm from '../components/SwapForm';
import { Toaster } from 'react-hot-toast';
import React from 'react';

// ★ WalletMultiButtonを動的にインポートし、SSRを無効にする
const DynamicWalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false } // ここが重要: サーバーサイドレンダリングを無効にする
);

export default function HomePage() {
  return (
    <main className="main-container">
      <div className="flex justify-end w-full max-w-md mb-4">
        {/* ★ ここでDynamicWalletMultiButtonを使用 */}
        <DynamicWalletMultiButton />
      </div>
      <h1 className="app-title">SWAP55</h1>
      
      <SwapForm />
      <Toaster position="bottom-right" />
    </main>
  );
}