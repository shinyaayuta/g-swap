// src/app/page.tsx

'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'; // <--- 追加
import SwapForm from '../components/SwapForm';
import { Toaster } from 'react-hot-toast'; // <--- react-hot-toast のトースターコンポーネント

// ウォレットアダプターのCSSをインポート (next.jsのpublicフォルダに置くか、直接インポート)
import '@solana/wallet-adapter-react-ui/styles.css';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Solana Swap App</h1>
      <div className="mb-4">
        {/* ウォレット接続ボタン */}
        <WalletMultiButton /> {/* <--- WalletMultiButton を使用 */}
      </div>
      <SwapForm />
      {/* トースト通知の表示エリア */}
      <Toaster position="bottom-right" /> {/* <--- react-hot-toast の表示エリア */}
    </main>
  );
}