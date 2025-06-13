// src/app/page.tsx

'use client'; // <-- このディレクティブを必ずファイルの先頭に記述してください

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import SwapForm from '../components/SwapForm';
import { Toaster } from 'react-hot-toast';
// @solana/wallet-adapter-react-ui/styles.css は globals.css でインポート済みのため、ここでは不要
// import '@solana/wallet-adapter-react-ui/styles.css'; 
import React, { useState, useEffect } from 'react'; // useState と useEffect をインポート

export default function HomePage() {
  // `isClient` ステートを定義し、コンポーネントがクライアントサイドでマウントされたか追跡
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // コンポーネントがブラウザでマウントされた後、この useEffect が実行される
    // これにより、`isClient` が `true` になり、クライアントサイドでのみレンダリングされる要素が表示される
    setIsClient(true);
  }, []); // 依存配列が空なので、コンポーネントがマウントされた時に一度だけ実行される

  return (
    <main className="main-container">
      <h1 className="app-title">gswap</h1>
      <div className="wallet-button-container">
        {/* WalletMultiButton はクライアントサイドでしか動作しない動的UIなので、
            `isClient` が true の場合にのみレンダリングする (ハイドレーションエラー対策) */}
        {isClient && <WalletMultiButton />} 
      </div>
      <SwapForm />
      {/* react-hot-toast の通知表示エリア */}
      <Toaster position="bottom-right" />
    </main>
  );
}