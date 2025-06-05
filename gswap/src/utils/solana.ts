// src/hooks/useTokenList.ts

import { useState, useEffect, useCallback } from 'react';
import { ENV as SPL_TOKEN_REGISTRY_ENV, TokenListProvider } from '@solana/spl-token-registry';

interface Token {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
  logoURI?: string;
  // 他のトークン情報
}

const JUPITER_TOKENS_API_URL = 'https://token.jup.ag/strict'; // Jupiterの厳密なトークンリスト

const useTokenList = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Jupiter APIからトークンリストを取得
      const response = await fetch(JUPITER_TOKENS_API_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch Jupiter token list: ${response.statusText}`);
      }
      const data = await response.json();
      setTokens(data);
      
      // 2. (オプション) @solana/spl-token-registry から取得することも可能だが、Jupiterの方が網羅性が高い場合が多い
      // const tokenListProvider = new TokenListProvider();
      // const tokenList = await tokenListProvider.resolve();
      // const splTokens = tokenList.filterByChainId(SPL_TOKEN_REGISTRY_ENV.Devnet).getList();
      // const mappedSplTokens = splTokens.map(t => ({
      //   address: t.address,
      //   symbol: t.symbol,
      //   decimals: t.decimals,
      //   name: t.name,
      //   logoURI: t.logoURI,
      // }));
      // setTokens(mappedSplTokens);

    } catch (err: any) {
      console.error('Error fetching token list:', err);
      setError(err.message || 'Failed to fetch token list');
      setTokens([]); // エラー時は空にするか、以前のキャッシュを保持
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  return { tokens, isLoading, error, refetch: fetchTokens };
};

export default useTokenList;