// src/hooks/useTokenBalance.tsx
'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSolanaConnection } from './useSolanaConnection';

import {
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';

/**
 * Hook 戻り値の型
 */
interface TokenBalanceState {
  balance: number | null;  // null = まだ取得していない
  isLoading: boolean;
  error: Error | null;
}

/**
 * 指定 Mint（null = SOL）の残高を取得するフック
 *
 * @param mint SPL トークンの Mint アドレス。SOL の場合は null
 */
export function useTokenBalance(mint: string | null): TokenBalanceState {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useSolanaConnection();

  const [state, setState] = useState<TokenBalanceState>({
    balance: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // 依存が変わるたびにキャンセルフラグを初期化
    let cancelled = false;

    const fetchBalance = async () => {
      if (!publicKey) {
        setState({ balance: null, isLoading: false, error: null });
        return;
      }

      try {
        // ---------- SOL ----------
        if (!mint) {
          const lamports = await connection.getBalance(publicKey, {
            commitment: 'confirmed',
          });
          if (!cancelled) {
            setState({
              balance: Number(lamports) / LAMPORTS_PER_SOL,
              isLoading: false,
              error: null,
            });
          }
          return;
        }

        // ---------- SPL Token ----------
        const mintKey = new PublicKey(mint);

        const ata = await getOrCreateAssociatedTokenAccount(
          connection,
          publicKey,       // 手数料支払いも兼ねる payer
          mintKey,
          publicKey,       // オーナー
          undefined,       // allow owner off curve = false
          'confirmed',
          undefined,       // program id (token2022 用なら変更)
          signTransaction, // wallet-adapter 署名
        );

        if (!cancelled) {
          setState({
            balance: Number(ata.amount) / 10 ** ata.decimals,
            isLoading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            balance: null,
            isLoading: false,
            error: err as Error,
          });
        }
      }
    };

    setState(s => ({ ...s, isLoading: true }));
    fetchBalance();

    // クリーンアップ関数でキャンセル
    return () => {
      cancelled = true;
    };
  }, [mint, publicKey, connection, signTransaction]);

  return state;
}
