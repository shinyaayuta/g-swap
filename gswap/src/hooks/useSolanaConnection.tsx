'use client';
import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

const RPCS = [
  clusterApiUrl(WalletAdapterNetwork.MainnetBeta),
  'https://api.mainnet.helius.xyz',
  'https://mainnet.rpcpool.com',
];

interface Ctx {
  endpoint: string;
  setEndpoint: (e: string) => void;
  endpoints: string[];
  connection: Connection;
}

const SolanaCtx = createContext<Ctx | null>(null);

export const useSolanaConnection = () => {
  const ctx = useContext(SolanaCtx);
  if (!ctx) throw new Error('useSolanaConnection must be used within <SolanaConnectionProvider>');
  return ctx;
};

export function SolanaConnectionProvider({ children }: { children: ReactNode }) {
  const [endpoint, setEndpoint] = useState(RPCS[0]);
  const connection = useMemo(() => new Connection(endpoint, 'confirmed'), [endpoint]);

  return (
    <SolanaCtx.Provider value={{ endpoint, setEndpoint, endpoints: RPCS, connection }}>
      {children}
    </SolanaCtx.Provider>
  );
}
