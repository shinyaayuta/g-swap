// src/components/SwapForm.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { toast } from 'react-hot-toast';
import useTokenList from '../hooks/useTokenList';
import useJupiterSwap from '../hooks/useJupiterSwap';
import TokenSelectList from './TokenSelectList';

import {useWalletBalance} from '../hooks/useWalletBalance';

interface Token {
  address: string;
  symbol: string;
  decimals: number;
  name: string; // TokenSelectListで使用するために追加
}

const WSOL_MINT_ADDRESS = 'So11111111111111111111111111111111111111112';

const SwapForm: React.FC = () => {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { tokens, isLoading: isTokenListLoading } = useTokenList();
  const { getQuote, getSwapTransaction, isLoading: isSwapLoading } = useJupiterSwap();

  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [quoteResponse, setQuoteResponse] = useState<any>(null);
  const [slippage, setSlippage] = useState<number>(0.5);

  const { balance: fromTokenBalance } = useWalletBalance(fromToken?.address);
  const { balance: toTokenBalance } = useWalletBalance(toToken?.address);

  useEffect(() => {
    // トークンリストがロードされ、かつ fromToken または toToken がまだ設定されていない場合
    if (tokens.length > 0) {
      if (!fromToken) {
        // Fromトークンの初期設定: ネイティブSOLを優先、見つからなければリストの最初のトークン
        const solToken = tokens.find(t => t.symbol === 'SOL' && t.isNative);
        setFromToken(solToken || tokens[0]);
      }
      if (!toToken) {
        // Toトークンの初期設定: USDCを優先、見つからなければリストの2番目のトークン (または最初のトークン以外)
        const usdcToken = tokens.find(t => t.symbol === 'USDC');
        // `fromToken` が設定されている場合、それと異なるトークンを選ぶようにする
        setToToken(usdcToken || tokens.find(t => t.address !== fromToken?.address) || tokens[0]); // <-- ここをsetToTokenに修正し、より頑健に
      }
    }
  }, [tokens, fromToken, toToken]); // 依存配列: tokens, fromToken, toToken の変更で再実行

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
    }, 500);
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
      
      toast.dismiss(loadingToastId);

      if (!swapTransaction) {
        toast.error('スワップトランザクションの取得に失敗しました。');
        return;
      }

      toast.loading('トランザクションを承認してください...', { id: 'approveTx' });
      const signature = await sendTransaction(swapTransaction, new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!));

      toast.dismiss('approveTx');
      toast.success(
        <span>
          スワップ成功！ <br />
          <a
            href={`https://solana.fm/tx/${signature}?cluster=${process.env.NEXT_PUBLIC_SOLANA_CLUSTER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline" // この部分はglobals.cssで定義されたクラス
          >
            SolanaFMで確認
          </a>
        </span>,
        { duration: 8000 }
      );
      console.log('Transaction signature:', signature);

    } catch (error: any) {
      console.error('Swap failed:', error);
      toast.dismiss(loadingToastId);
      toast.error(`スワップ失敗: ${error.message || '不明なエラー'}`);
    }
  };

  const calculatePriceImpact = (data: any) => {
    if (!data || !data.inAmount || !data.outAmount || !data.priceImpactPct) return 'N/A';
    return (parseFloat(data.priceImpactPct) * 100).toFixed(2) + '%';
  };

  return (
    <div className="swap-form-container"> {/* <-- クラス名を変更 */}
      {isTokenListLoading && <p>トークンリストを読み込み中...</p>}
      {!isTokenListLoading && tokens.length === 0 && <p>トークンリストの取得に失敗しました。</p>}

      <div className="form-group"> {/* <-- クラス名を変更 */}
        <label className="form-label">From</label> {/* <-- クラス名を変更 */}
        <TokenSelectList 
          selectedToken={fromToken} 
          onSelect={(token) => {
            setFromToken(token);
            if (token === toToken) setToToken(null);
          }} 
          tokens={tokens.filter(t => t !== toToken)}
        />
        <input
          type="number"
          placeholder="Amount"
          className="input-field mt-2" 
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0"
          step="any"
        />
        {fromTokenBalance !== null && <p className="text-gray-400 text-sm mt-1">Balance: {fromTokenBalance.toFixed(4)}</p>}
      </div>

      <div className="form-group"> {/* <-- クラス名を変更 */}
        <label className="form-label">To</label> {/* <-- クラス名を変更 */}
        <TokenSelectList 
          selectedToken={toToken} 
          onSelect={(token) => {
            setToToken(token);
            if (token === fromToken) setFromToken(null);
          }} 
          tokens={tokens.filter(t => t !== fromToken)}
        />
        {quoteResponse && (
          <p className="text-gray-400 text-sm mt-2"> {/* <-- この部分はglobals.cssで定義されたクラス */}
            You will get: {(quoteResponse.outAmount / (10 ** toToken!.decimals)).toFixed(toToken!.decimals)} {toToken?.symbol}
          </p>
        )}
        {toTokenBalance !== null && <p className="text-gray-400 text-sm mt-1">Balance: {toTokenBalance.toFixed(4)}</p>}
      </div>

      <div className="form-group"> {/* <-- クラス名を変更 */}
        <label className="form-label">Slippage (%)</label> {/* <-- クラス名を変更 */}
        <input
          type="number"
          className="input-field" 
          value={slippage}
          onChange={(e) => setSlippage(parseFloat(e.target.value))}
          min="0"
          step="0.1"
        />
      </div>

      {quoteResponse && (
        <div className="mb-4 text-gray-400 text-sm"> {/* <-- この部分はglobals.cssで定義されたクラス */}
          <p>Estimated Rate: 1 {fromToken?.symbol} ≈ {(quoteResponse.outAmount / (10 ** toToken!.decimals)) / (parseFloat(amount))} {toToken?.symbol}</p>
          <p>Price Impact: {calculatePriceImpact(quoteResponse)}</p>
        </div>
      )}

      <button
        onClick={handleSwap}
        disabled={!connected || isSwapLoading || !fromToken || !toToken || !amount || parseFloat(amount) <= 0 || !quoteResponse}
        className="swap-button" 
      >
        {isSwapLoading ? 'スワップ中...' : 'スワップ'}
      </button>
    </div>
  );
};

export default SwapForm;