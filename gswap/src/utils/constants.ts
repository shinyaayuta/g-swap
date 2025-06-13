// src/utils/constants.ts

// .env.localから環境変数を読み込む
// Next.jsでは、NEXT_PUBLIC_プレフィックスを付けることでクライアントサイドでも利用可能

// 複数のRPCエンドポイントを配列で定義し、環境変数があればそれを使用する
export const SOLANA_RPC_URLS = [
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL_MAINNET_1 || 'https://api.mainnet-beta.solana.com',
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL_MAINNET_2 || 'https://solana-api.projectserum.com', // 例として別のRPCプロバイダ
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL_DEVNET || 'https://api.devnet.solana.com', // 開発用
].filter(Boolean); // undefined や null を取り除く

export const JUPITER_API_KEY = process.env.NEXT_PUBLIC_JUPITER_API_KEY; // Jupiter API Key (もし必要なら)
export const SOLANA_CLUSTER = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'mainnet-beta'; // "devnet", "mainnet-beta"など