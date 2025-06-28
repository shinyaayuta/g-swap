// src/hooks/useWalletBalance.ts

import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';

export const useWalletBalance = (tokenMintAddress?: string) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    const getBalance = async () => {
      setLoading(true);
      try {
        if (tokenMintAddress) {
          const tokenMint = new PublicKey(tokenMintAddress);
          const associatedTokenAccount = await getAssociatedTokenAddress(tokenMint, publicKey);
          const tokenBalance = await connection.getTokenAccountBalance(associatedTokenAccount);
          setBalance(tokenBalance.value.uiAmount);
        } else {
          const solBalance = await connection.getBalance(publicKey);
          setBalance(solBalance / LAMPORTS_PER_SOL);
        }
      } catch (error) {
        console.error('Failed to get wallet balance:', error);
        setBalance(null);
      } finally {
        setLoading(false);
      }
    };

    getBalance();
    
    // 残高を定期的に更新するためのポーリング設定
    const interval = setInterval(getBalance, 30000); // 30秒ごとに更新

    return () => clearInterval(interval);
  }, [publicKey, connection, tokenMintAddress]);

  return { balance, loading };
};
