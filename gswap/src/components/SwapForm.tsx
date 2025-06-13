// src/components/SwapForm.tsx

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { toast } from 'react-hot-toast';
import useTokenList from '../hooks/useTokenList';
import useJupiterSwap from '../hooks/useJupiterSwap';
import TokenSelectList from './TokenSelectList';
import { useSolanaConnection } from '../hooks/useSolanaConnection'; // NEW: RPC Connection Hook
import { useTokenBalance } from '../hooks/useTokenBalance'; // NEW: Token Balance Hook
import { useTransactionWatcher } from '../hooks/useTransactionWatcher'; // NEW: Transaction Watcher Hook

interface Token {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
  logoURI?: string;
  isNative?: boolean;
}

const WSOL_MINT_ADDRESS = 'So11111111111111111111111111111111111111112'; // この定数は現在のバージョンでは直接使用されていませんが、一般的に便利です。

const SwapForm: React.FC = () => {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useSolanaConnection(); // NEW: カスタムConnectionフック
  const { tokens, isLoading: isTokenListLoading } = useTokenList();
  const { getQuote, getSwapTransaction, isLoading: isSwapLoading } = useJupiterSwap();
  const { watchTransaction } = useTransactionWatcher(); // NEW: トランザクション監視フック

  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [quoteResponse, setQuoteResponse] = useState<any>(null);
  const [slippage, setSlippage] = useState<number>(0.5); // Slippage in percentage (例: 0.5は0.5%)

  // ウォレット残高の取得
  const { balance: fromTokenBalance, isLoading: isFromBalanceLoading } = useTokenBalance(fromToken?.address || null);
  const { balance: toTokenBalance, isLoading: isToBalanceLoading } = useTokenBalance(toToken?.address || null);

  // 初期のトークン設定
  useEffect(() => {
    if (tokens.length > 0) {
      if (!fromToken) {
        const solToken = tokens.find(t => t.symbol === 'SOL' && t.isNative);
        setFromToken(solToken || tokens[0]);
      }
      if (!toToken) {
        const usdcToken = tokens.find(t => t.symbol === 'USDC');
        setToToken(usdcToken || tokens.find(t => t.address !== fromToken?.address) || tokens[0]);
      }
    }
  }, [tokens, fromToken, toToken]);

  // 入力値の変更時に見積もりを取得
  useEffect(() => {
    const fetchQuote = async () => {
      if (fromToken && toToken && amount && parseFloat(amount) > 0 && connection) {
        try {
          // Jupiter API は slippageBps を期待するため、パーセンテージをBPSに変換
          const slippageBps = Math.floor(slippage * 100); 
          const quote = await getQuote(
            fromToken.address,
            toToken.address,
            parseFloat(amount) * (10 ** fromToken.decimals),
            slippageBps
          );
          setQuoteResponse(quote);
        } catch (error) {
          console.error('Failed to fetch quote:', error);
          setQuoteResponse(null);
          // 入力された数量が0でない場合にのみエラーのトーストを表示
          if (parseFloat(amount) > 0) {
            toast.error('見積もり取得に失敗しました。', { id: 'quote-error' });
          }
        }
      } else {
        setQuoteResponse(null);
      }
    };
    const handler = setTimeout(() => {
      fetchQuote();
    }, 500); // 見積もり取得のデバウンス
    return () => clearTimeout(handler);
  }, [fromToken, toToken, amount, slippage, getQuote, connection]);

  const handleSwap = async () => {
    if (!connected || !publicKey || !connection) {
      toast.error('ウォレットを接続し、ネットワークに接続されていることを確認してください。');
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
      
      toast.dismiss(loadingToastId);

      if (!swapTransaction) {
        toast.error('スワップトランザクションの取得に失敗しました。');
        return;
      }

      toast.loading('トランザクションを承認してください...', { id: 'approveTx' });
      const signature = await sendTransaction(swapTransaction, connection); // connection を渡す

      toast.dismiss('approveTx');
      
      // NEW: トランザクション監視を開始
      watchTransaction(signature, connection); 

    } catch (error: any) {
      console.error('Swap failed:', error);
      toast.dismiss(loadingToastId);
      toast.dismiss('approveTx'); // 承認要求のトーストも閉じる
      // ウォレットアダプターからのユーザー拒否エラーを特別にチェック
      if (error.message && error.message.includes('User rejected the request')) {
        toast.error('トランザクションはユーザーによって拒否されました。');
      } else {
        toast.error(`スワップ失敗: ${error.message || '不明なエラー'}`);
      }
    }
  };

  // Price Impactの計算とクラス名決定ロジック
  const priceImpact = useMemo(() => {
    if (!quoteResponse || !quoteResponse.priceImpactPct) return null;
    const impact = parseFloat(quoteResponse.priceImpactPct) * 100; // パーセンテージに変換
    let className = 'price-impact-low';
    let warningMessage = '';

    if (impact > 1 && impact <= 5) { // 例: 1%超5%以下で中程度の警告
      className = 'price-impact-medium';
      warningMessage = '価格影響が大きいです。ご注意ください。';
    }
    if (impact > 5) { // 例: 5%超で強い警告
      className = 'price-impact-high';
      warningMessage = '価格影響が非常に大きいです！取引を再考してください。';
    }
    return { value: impact.toFixed(2) + '%', className, warningMessage };
  }, [quoteResponse]);

  // 最大額を設定するヘルパー
  const handleSetMaxAmount = () => {
    if (fromTokenBalance !== null && fromToken) {
      // SOLの場合、トランザクション手数料のために少し残す (例: 0.01 SOL)
      // 他のトークンの場合はそのまま全額
      const amountToSet = fromToken.symbol === 'SOL' ? Math.max(0, fromTokenBalance - 0.01) : fromTokenBalance;
      setAmount(amountToSet.toString());
    }
  };


  return (
    <div className="swap-form-container">
      {isTokenListLoading && <p className="text-gray-400">トークンリストを読み込み中...</p>}
      {!isTokenListLoading && tokens.length === 0 && <p className="text-red-400">トークンリストの取得に失敗しました。</p>}

      <div className="form-group">
        <label className="form-label">From</label>
        <TokenSelectList 
          selectedToken={fromToken} 
          onSelect={(token) => {
            setFromToken(token);
            if (token.address === toToken?.address) {
              setToToken(null);
            }
          }} 
          tokens={tokens.filter(t => t.address !== toToken?.address)}
        />
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
          <input
            type="number"
            placeholder="Amount"
            className="input-field flex-grow" // 利用可能なスペースを占めるようにflex-grow
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="any"
          />
          <button 
            onClick={handleSetMaxAmount} 
            className="ml-2 py-1 px-3 bg-gray-600 hover:bg-gray-500 rounded text-sm text-white"
            disabled={!publicKey || fromTokenBalance === null || isFromBalanceLoading}
          >
            MAX
          </button>
        </div>
        {publicKey && ( // ウォレット接続時に残高表示
          <p className="text-gray-400 text-sm mt-2">
            Balance: {isFromBalanceLoading ? 'Loading...' : `${fromTokenBalance !== null ? fromTokenBalance.toFixed(fromToken?.decimals || 2) : 'N/A'} ${fromToken?.symbol || ''}`}
          </p>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">To</label>
        <TokenSelectList 
          selectedToken={toToken} 
          onSelect={(token) => {
            setToToken(token);
            if (token.address === fromToken?.address) {
              setFromToken(null);
            }
          }} 
          tokens={tokens.filter(t => t.address !== fromToken?.address)}
        />
        {quoteResponse && toToken && ( // toTokenの存在確認を追加
          <p className="text-gray-400 text-sm mt-2">
            You will get: {(quoteResponse.outAmount / (10 ** toToken.decimals)).toFixed(toToken.decimals)} {toToken.symbol}
          </p>
        )}
        {publicKey && ( // ウォレット接続時に残高表示
          <p className="text-gray-400 text-sm mt-2">
            Balance: {isToBalanceLoading ? 'Loading...' : `${toTokenBalance !== null ? toTokenBalance.toFixed(toToken?.decimals || 2) : 'N/A'} ${toToken?.symbol || ''}`}
          </p>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Slippage (%)</label>
        <input
          type="number"
          className="input-field" 
          value={slippage}
          onChange={(e) => setSlippage(parseFloat(e.target.value))}
          min="0"
          step="0.1"
          max="50" // 最大スリッページを設ける
        />
      </div>

      {quoteResponse && (
        <div className="mb-4 text-gray-400 text-sm">
          <p>Estimated Rate: 1 {fromToken?.symbol} ≈ {((quoteResponse.outAmount / (10 ** (toToken?.decimals || 0))) / parseFloat(amount)).toFixed(toToken?.decimals || 2)} {toToken?.symbol}</p> {/* decimalsのnullチェック追加 */}
          {priceImpact && (
            <>
              <p className={priceImpact.className}>Price Impact: {priceImpact.value}</p>
              {priceImpact.warningMessage && (
                <p className="warning-message">{priceImpact.warningMessage}</p>
              )}
            </>
          )}
        </div>
      )}

      <button
        onClick={handleSwap}
        disabled={
          !connected || 
          isSwapLoading || 
          !fromToken || 
          !toToken || 
          !amount || 
          parseFloat(amount) <= 0 || 
          !quoteResponse ||
          (priceImpact && parseFloat(priceImpact.value) >= 10) // 例: 価格影響が10%以上でスワップボタンを無効化
        }
        className="swap-button" 
      >
        {isSwapLoading ? 'スワップ中...' : 'スワップ'}
      </button>
    </div>
  );
};

export default SwapForm;