// src/types/index.ts
// アプリケーション全体で使用する共通の型定義

export interface Token {
  address: string;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  logoURI?: string;
  tags?: string[];
}