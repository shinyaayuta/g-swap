// src/utils/constants.ts

// .env.localから環境変数を読み込む
// Next.jsでは、NEXT_PUBLIC_プレフィックスを付けることでクライアントサイドでも利用可能
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
export const JUPITER_API_KEY = process.env.NEXT_PUBLIC_JUPITER_API_KEY; // Jupiter API Key (もし必要なら)
export const SOLANA_CLUSTER = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'mainnet-beta'; // "devnet", "mainnet-beta"など