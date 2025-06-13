// src/hooks/useTransactionWatcher.ts
import { useCallback } from 'react';
import { Connection, SignatureResult, TransactionResponse, TransactionSignature } from '@solana/web3.js';
import { toast } from 'react-hot-toast';
import { SOLANA_CLUSTER } from '../utils/constants'; // Solana Clusterをインポート
import React from 'react'; // Reactをインポート

interface UseTransactionWatcher {
  watchTransaction: (signature: TransactionSignature, connection: Connection) => void;
}

export const useTransactionWatcher = (): UseTransactionWatcher => {

  const watchTransaction = useCallback((signature: TransactionSignature, connection: Connection) => {
    let toastId: string | undefined;

    const showTransactionToast = (status: 'pending' | 'success' | 'failed', txId: string) => {
      const explorerLink = `https://solana.fm/tx/${txId}?cluster=${SOLANA_CLUSTER}`;
      if (toastId) {
        toast.dismiss(toastId);
      }
      switch (status) {
        case 'pending':
          toastId = toast.loading(
            // JSXを直接渡すのではなく、React.createElementを使用するか、
            // よりシンプルなテンプレートリテラルで記述
            // エラー箇所の '...' は改行後のスペースやタブによるものかもしれません
            // 以下のように、改行を除去するか、React.Fragmentを使用する
            React.createElement('span', null, 
              'トランザクションを処理中...', 
              React.createElement('br'),
              React.createElement('a', { 
                href: explorerLink, 
                target: '_blank', 
                rel: 'noopener noreferrer', 
                className: 'text-blue-400 underline' 
              }, '確認する')
            ),
            { duration: Infinity }
          );
          break;
        case 'success':
          toastId = toast.success(
            React.createElement('span', null, 
              'トランザクションが承認されました！', 
              React.createElement('br'),
              React.createElement('a', { 
                href: explorerLink, 
                target: '_blank', 
                rel: 'noopener noreferrer', 
                className: 'text-blue-400 underline' 
              }, 'SolanaFMで確認')
            ),
            { duration: 8000 }
          );
          break;
        case 'failed':
          toastId = toast.error(
            React.createElement('span', null, 
              'トランザクションに失敗しました。', 
              React.createElement('br'),
              React.createElement('a', { 
                href: explorerLink, 
                target: '_blank', 
                rel: 'noopener noreferrer', 
                className: 'text-blue-400 underline' 
              }, '詳細を見る')
            ),
            { duration: 10000 }
          );
          break;
      }
    };

    // 初期状態を保留中で表示
    showTransactionToast('pending', signature);

    // トランザクションの確認を待つ
    connection.confirmTransaction(signature, 'confirmed')
      .then((confirmation) => {
        if (confirmation.value.err) {
          console.error('Transaction failed:', confirmation.value.err);
          showTransactionToast('failed', signature);
        } else {
          showTransactionToast('success', signature);
        }
      })
      .catch((error) => {
        console.error('Transaction confirmation error:', error);
        showTransactionToast('failed', signature);
      });

  }, []);

  return { watchTransaction };
};