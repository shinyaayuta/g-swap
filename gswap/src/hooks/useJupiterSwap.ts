// src/hooks/useJupiterSwap.ts

import { useState, useCallback } from 'react';
import { Connection, VersionedTransaction, TransactionMessage, PublicKey, Transaction } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'react-hot-toast';

interface QuoteResponse {
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
  // ... 他のJupiter quoteレスポンスのフィールド
}

const JUPITER_API_BASE_URL = 'https://quote-api.jup.ag/v6'; // Jupiter APIのエンドポイント

const useJupiterSwap = () => {
  const { publicKey } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  // 見積もりを取得
  const getQuote = useCallback(async (fromMint: string, toMint: string, amount: number, slippageBps: number = 50) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${JUPITER_API_BASE_URL}/quote?inputMint=${fromMint}&outputMint=${toMint}&amount=${amount}&slippageBps=${slippageBps}`
      );
      if (!response.ok) {
        throw new Error(`Error fetching quote: ${response.statusText}`);
      }
      const data = await response.json();
      if (!data.data || data.data.length === 0) {
        throw new Error('No routes found for this swap.');
      }
      return data.data[0]; // 最も良いルートを返す
    } catch (error) {
      console.error('Failed to get Jupiter quote:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // スワップトランザクションを取得
  const getSwapTransaction = useCallback(async (quoteResponse: any) => {
    setIsLoading(true);
    if (!publicKey) {
      toast.error('ウォレットが接続されていません。');
      setIsLoading(false);
      return null;
    }
    try {
      const response = await fetch(`${JUPITER_API_BASE_URL}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: publicKey.toBase58(),
          wrapAndUnwrapSol: true, // SOLの自動ラップ/アンラップ
          // feeAccount: '...', // 必要であれば指定
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error fetching swap transaction: ${errorData.error || response.statusText}`);
      }

      const { swapTransaction } = await response.json();
      const transactionBuf = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(transactionBuf);

      return transaction;

    } catch (error) {
      console.error('Failed to get Jupiter swap transaction:', error);
      toast.error(`トランザクション生成エラー: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);

  return { getQuote, getSwapTransaction, isLoading };
};

export default useJupiterSwap;