// src/components/SwapForm.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { toast } from 'react-hot-toast'; // <--- react-hot-toast をインポート
import useTokenList from '../hooks/useTokenList'; // <--- useTokenList をインポート
import useJupiterSwap from '../hooks/useJupiterSwap'; // <--- useJupiterSwap をインポート
import TokenSelectList from './TokenSelectList'; // トークン選択UIコンポーネント

interface Token {
  address: string;
  symbol: string;
  decimals: number;
  // 他のトークン情報
}

const SwapForm: React.FC = () => {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { tokens, isLoading: isTokenListLoading } = useTokenList(); // トークンリストを取得
  const { getQuote, getSwapTransaction, isLoading: isSwapLoading } = useJupiterSwap();

  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [quoteResponse, setQuoteResponse] = useState<any>(null); // 見積もり結果
  const [slippage, setSlippage] = useState<number>(0.5); // スリップページ (デフォルト0.5%)

  useEffect(() => {
    // 初回ロード時にデフォルトのトークンを設定
    if (tokens.length > 0 && !fromToken) {
      setFromToken(tokens.find(t => t.symbol === 'SOL') || tokens[0]);
    }
    if (tokens.length > 0 && !toToken) {
      setToToken(tokens.find(t => t.symbol === 'USDC') || tokens[1]);
    }
  }, [tokens, fromToken, toToken]);

  // 見積もり取得
  useEffect(() => {
    const fetchQuote = async () => {
      if (fromToken && toToken && amount && parseFloat(amount) > 0) {
        try {
          const quote = await getQuote(
            fromToken.address,
            toToken.address,
            parseFloat(amount) * (10 ** fromToken.decimals)
          );
          setQuoteResponse(quote);
        } catch (error) {
          console.error('Failed to fetch quote:', error);
          setQuoteResponse(null);
          toast.error('見積もり取得に失敗しました。');
        }
      } else {
        setQuoteResponse(null);
      }
    };
    const handler = setTimeout(() => {
      fetchQuote();
    }, 500); // デバウンス
    return () => clearTimeout(handler);
  }, [fromToken, toToken, amount, getQuote]);

  const handleSwap = async () => {
    if (!connected || !publicKey) {
      toast.error('ウォレットを接続してください。');
      return;
    }
    if (!fromToken || !toToken || !amount || parseFloat(amount) <= 0 || !quoteResponse) {
      toast.error('スワップ情報を入力してください。');
      return;
    }

    let loadingToastId: string | undefined;

    try {
      loadingToastId = toast.loading('トランザクションを生成中...');
      
      const swapTransaction = await getSwapTransaction(quoteResponse);
      
      toast.dismiss(loadingToastId); // ローディングトーストを閉じる

      if (!swapTransaction) {
        toast.error('スワップトランザクションの取得に失敗しました。');
        return;
      }

      // トランザクションの署名と送信
      toast.loading('トランザクションを承認してください...', { id: 'approveTx' });
      const signature = await sendTransaction(swapTransaction, new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!)); // 環境変数からRPC URLを取得

      toast.dismiss('approveTx'); // 承認トーストを閉じる
      toast.success(
        <span>
          スワップ成功！ <br />
          <a
            href={`https://solana.fm/tx/${signature}?cluster=${process.env.NEXT_PUBLIC_SOLANA_CLUSTER}`} // <--- SolanaFMへのリンク
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline"
          >
            SolanaFMで確認
          </a>
        </span>,
        { duration: 8000 }
      );
      console.log('Transaction signature:', signature);

      // DevnetスワップのQAテスト: ここで成功の確認ロジックを追加
      // 例えば、スワップ後の残高をチェックするなど

    } catch (error: any) {
      console.error('Swap failed:', error);
      toast.dismiss(loadingToastId); // ローディングトーストを閉じる
      toast.error(`スワップ失敗: ${error.message || '不明なエラー'}`);
      // react-hot-toast (成功失敗通知): エラーメッセージをトーストで表示
    }
  };

  const calculatePriceImpact = (data: any) => {
    if (!data || !data.inAmount || !data.outAmount || !data.priceImpactPct) return 'N/A';
    // Jupiter APIから取得したpriceImpactPctをそのまま表示
    return (parseFloat(data.priceImpactPct) * 100).toFixed(2) + '%';
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
      {isTokenListLoading && <p>トークンリストを読み込み中...</p>}
      {!isTokenListLoading && tokens.length === 0 && <p>トークンリストの取得に失敗しました。</p>}

      <div className="mb-4">
        <label className="block text-gray-400 text-sm font-bold mb-2">From</label>
        <TokenSelectList 
          selectedToken={fromToken} 
          onSelect={(token) => {
            setFromToken(token);
            if (token === toToken) setToToken(null); // 同じトークンを選択した場合、Toをリセット
          }} 
          tokens={tokens.filter(t => t !== toToken)} // FromとToで同じトークンを選べないようにする
        />
        <input
          type="number"
          placeholder="Amount"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mt-2 bg-gray-700"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0"
          step="any"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-400 text-sm font-bold mb-2">To</label>
        <TokenSelectList 
          selectedToken={toToken} 
          onSelect={(token) => {
            setToToken(token);
            if (token === fromToken) setFromToken(null); // 同じトークンを選択した場合、Fromをリセット
          }} 
          tokens={tokens.filter(t => t !== fromToken)} // FromとToで同じトークンを選べないようにする
        />
        {quoteResponse && (
          <p className="text-gray-400 text-sm mt-2">
            You will get: {(quoteResponse.outAmount / (10 ** toToken!.decimals)).toFixed(toToken!.decimals)} {toToken?.symbol}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-gray-400 text-sm font-bold mb-2">Slippage (%)</label>
        <input
          type="number"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700"
          value={slippage}
          onChange={(e) => setSlippage(parseFloat(e.target.value))}
          min="0"
          step="0.1"
        />
      </div>

      {quoteResponse && (
        <div className="mb-4 text-gray-400 text-sm">
          <p>Estimated Rate: 1 {fromToken?.symbol} ≈ {(quoteResponse.outAmount / (10 ** toToken!.decimals)) / (parseFloat(amount))} {toToken?.symbol}</p>
          <p>Price Impact: {calculatePriceImpact(quoteResponse)}</p> {/* 見積もり表示 - 価格インパクト表示 */}
        </div>
      )}

      <button
        onClick={handleSwap}
        disabled={!connected || isSwapLoading || !fromToken || !toToken || !amount || parseFloat(amount) <= 0 || !quoteResponse}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSwapLoading ? 'スワップ中...' : 'スワップ'}
      </button>
    </div>
  );
};

export default SwapForm;