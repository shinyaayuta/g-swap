// src/types/jupiter.ts
// Jupiter APIのレスポンスやリクエストに関連する型定義

export interface JupiterQuoteResponse {
  inAmount: string; // 入力トークンの最小単位での量
  outAmount: string; // 出力トークンの最小単位での量
  priceImpactPct: string; // 価格インパクトの割合 (例: "0.001" は 0.1%)
  // ... その他Jupiter APIのquoteエンドポイントのレスポンスフィールド
  marketInfos: any[]; // 市場情報
  swapMode: string; // "ExactIn" or "ExactOut"
  // ...
}

export interface JupiterSwapRequest {
  quoteResponse: JupiterQuoteResponse;
  userPublicKey: string;
  wrapAndUnwrapSol?: boolean;
  prioritizationFeeLamports?: number;
  feeAccount?: string;
}

export interface JupiterSwapResponse {
  swapTransaction: string; // base64エンコードされたVersionedTransaction
}