// src/components/SwapForm.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';
import { toast } from 'react-hot-toast';
import useTokenList from '../hooks/useTokenList';
import useJupiterSwap from '../hooks/useJupiterSwap';
import TokenSelectList from './TokenSelectList';
import { useWalletBalance } from '../hooks/useWalletBalance';

interface Token {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
  logoURI?: string;
}

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
    if (tokens.length > 0) {
      if (!fromToken) {
        const solToken = tokens.find(t => t.symbol === 'SOL'); // Assuming 'SOL' is native
        setFromToken(solToken || tokens[0]);
      }
      if (!toToken) {
        const usdcToken = tokens.find(t => t.symbol === 'USDC');
        setToToken(usdcToken || tokens.find(t => t.address !== fromToken?.address) || tokens[1] || tokens[0]);
      }
    }
  }, [tokens, fromToken, toToken]);

  useEffect(() => {
    const fetchQuote = async () => {
      if (fromToken && toToken && amount && parseFloat(amount) > 0) {
        try {
          const quote = await getQuote(
            fromToken.address,
            toToken.address,
            parseFloat(amount) * (10 ** fromToken.decimals),
            slippage * 100 // Convert percentage to basis points
          );
          setQuoteResponse(quote);
        } catch (error) {
          console.error('Failed to fetch quote:', error);
          setQuoteResponse(null);
          toast.error('Failed to fetch quote.');
        }
      } else {
        setQuoteResponse(null);
      }
    };
    const handler = setTimeout(() => {
      fetchQuote();
    }, 500);
    return () => clearTimeout(handler);
  }, [fromToken, toToken, amount, slippage, getQuote]);

  const handleSwap = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet.');
      return;
    }
    if (!fromToken || !toToken || !amount || parseFloat(amount) <= 0 || !quoteResponse) {
      toast.error('Please enter swap details.');
      return;
    }

    let loadingToastId: string | undefined;

    try {
      loadingToastId = toast.loading('Generating transaction...');
      
      const swapTransaction = await getSwapTransaction(quoteResponse);
      
      toast.dismiss(loadingToastId);

      if (!swapTransaction) {
        toast.error('Failed to get swap transaction.');
        return;
      }

      toast.loading('Please approve the transaction...', { id: 'approveTx' });
      const signature = await sendTransaction(swapTransaction, new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!));

      toast.dismiss('approveTx');
      toast.success(
        <span>
          Swap successful! <br />
          <a
            href={`https://solana.fm/tx/${signature}?cluster=${process.env.NEXT_PUBLIC_SOLANA_CLUSTER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline"
          >
            View on SolanaFM
          </a>
        </span>,
        { duration: 8000 }
      );
      console.log('Transaction signature:', signature);

    } catch (error: any) {
      console.error('Swap failed:', error);
      toast.dismiss(loadingToastId);
      toast.error(`Swap failed: ${error.message || 'Unknown error'}`);
    }
  };

  const calculatePriceImpact = useCallback((data: any) => {
    if (!data || !data.inAmount || !data.outAmount || !data.priceImpactPct) return 'N/A';
    return (parseFloat(data.priceImpactPct) * 100).toFixed(2) + '%';
  }, []);

  const reverseSwap = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount('');
    setQuoteResponse(null);
  };

  return (
    <div className="swap-card">
      {isTokenListLoading && <p className="text-center text-gray-400">Loading token list...</p>}
      {!isTokenListLoading && tokens.length === 0 && <p className="text-center text-red-400">Failed to load token list.</p>}

      <div className="input-group">
        <div className="input-label-row">
          <label className="input-label">You pay</label>
          {fromTokenBalance !== null && <span className="balance-text">Balance: {fromTokenBalance.toFixed(4)} {fromToken?.symbol}</span>}
        </div>
        <div className="input-field-row">
          <input
            type="number"
            placeholder="0.0"
            className="token-amount-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="any"
          />
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
        </div>
      </div>

      <div className="swap-icon-container">
        <button onClick={reverseSwap} className="swap-icon-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="swap-arrows">
            <polyline points="17 1 21 5 17 9"></polyline>
            <path d="M21 5H3"></path>
            <polyline points="7 23 3 19 7 15"></polyline>
            <path d="M3 19h18"></path>
          </svg>
        </button>
      </div>

      <div className="input-group">
        <div className="input-label-row">
          <label className="input-label">You receive</label>
          {toTokenBalance !== null && <span className="balance-text">Balance: {toTokenBalance.toFixed(4)} {toToken?.symbol}</span>}
        </div>
        <div className="input-field-row">
          <input
            type="text" // Use text for display, as it's an output
            placeholder="0.0"
            className="token-amount-input"
            value={quoteResponse ? (quoteResponse.outAmount / (10 ** toToken!.decimals)).toFixed(toToken!.decimals) : ''}
            readOnly
          />
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
        </div>
      </div>

      <div className="details-section">
        <div className="detail-row">
          <span>Slippage tolerance</span>
          <input
            type="number"
            className="slippage-input"
            value={slippage}
            onChange={(e) => setSlippage(parseFloat(e.target.value))}
            min="0.1"
            max="50"
            step="0.1"
          />
          <span>%</span>
        </div>
        {quoteResponse && (
          <>
            <div className="detail-row">
              <span>Price Impact</span>
              <span>{calculatePriceImpact(quoteResponse)}</span>
            </div>
            <div className="detail-row">
              <span>Estimated Rate</span>
              <span>1 {fromToken?.symbol} ≈ {(quoteResponse.outAmount / (10 ** toToken!.decimals)) / parseFloat(amount)} {toToken?.symbol}</span>
            </div>
          </>
        )}
      </div>

      <button
        onClick={handleSwap}
        disabled={!connected || isSwapLoading || !fromToken || !toToken || !amount || parseFloat(amount) <= 0 || !quoteResponse}
        className="swap-button"
      >
        {isSwapLoading ? 'Swapping...' : connected ? 'Swap' : 'Connect Wallet'}
      </button>
    </div>
  );
};

export default SwapForm;