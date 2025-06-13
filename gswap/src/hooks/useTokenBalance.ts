// src/hooks/useTokenBalance.ts
import { useState, useEffect, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSolanaConnection } from './useSolanaConnection'; // カスタムConnectionフック
import { getAssociatedTokenAddressSync, getAccount } from '@solana/spl-token'; // SPLトークン残高取得用

interface UseTokenBalance {
  balance: number | null;
  isLoading: boolean;
  error: string | null;
  refetchBalance: () => void;
}

export const useTokenBalance = (tokenMintAddress: string | null): UseTokenBalance => {
  const { publicKey } = useWallet();
  const { connection } = useSolanaConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connection || !tokenMintAddress) {
      setBalance(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const mintPublicKey = new PublicKey(tokenMintAddress);

      // SOLの場合 (ネイティブSOLとWSOL両方に対応)
      if (tokenMintAddress === 'So11111111111111111111111111111111111111112' || tokenMintAddress === 'SOL') { // 'SOL' symbol support
        const lamports = await connection.getBalance(publicKey);
        setBalance(lamports / 10 ** 9); // SOLは9桁
      } else {
        // SPLトークンの場合
        const associatedTokenAccount = getAssociatedTokenAddressSync(mintPublicKey, publicKey);
        const accountInfo = await connection.getAccountInfo(associatedTokenAccount);

        if (accountInfo) {
          const tokenAccount = await getAccount(connection, associatedTokenAccount);
          setBalance(Number(tokenAccount.amount) / (10 ** tokenAccount.mint.decimals)); // トークンのdecimalsを使用
        } else {
          setBalance(0); // ATAがない場合は残高0
        }
      }
    } catch (err: any) {
      console.error(`Failed to fetch balance for ${tokenMintAddress}:`, err);
      setError(`残高取得エラー: ${err.message}`);
      setBalance(null);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, tokenMintAddress]);

  useEffect(() => {
    fetchBalance();
    // ウォレット接続やRPC変更時にも残高を更新
    // リアルタイム更新のため、Account subscriptionも検討可能ですが、今回はシンプルに再フェッチ
    const interval = setInterval(fetchBalance, 15000); // 15秒ごとに残高を更新
    return () => clearInterval(interval);
  }, [fetchBalance]);

  return { balance, isLoading, error, refetchBalance: fetchBalance };
};