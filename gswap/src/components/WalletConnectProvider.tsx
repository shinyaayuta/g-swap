"use client";

import {
  ConnectionProvider,
  WalletProvider,
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react';
import {
  WalletAdapterNetwork,
} from '@solana/wallet-adapter-base';
import {
  WalletModalProvider,
} from '@solana/wallet-adapter-react-ui';
import {
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import BN from 'bn.js';

// ---------------- Balance Context ----------------
interface BalanceState {
  balanceLamports: BN | null;
  refresh: () => Promise<void>;
}
const BalanceCtx = createContext<BalanceState | null>(null);
export const useSolBalance = () => {
  const ctx = useContext(BalanceCtx);
  if (!ctx) throw new Error('useSolBalance must be used within <WalletConnectProvider>');
  return ctx;
};
// --------------------------------------------------

export function WalletConnectProvider({ children }: { children: ReactNode }) {
  const network = WalletAdapterNetwork.MainnetBeta;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network })],
    [network],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <BalanceProvider>{children}</BalanceProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

// -------- Internal Balance Provider --------------
function BalanceProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [lamports, setLamports] = useState<BN | null>(null);

  const refresh = async () => {
    if (!publicKey) return setLamports(null);
    const raw = await connection.getBalance(publicKey, { commitment: 'confirmed' }); // bigint
    setLamports(new BN(raw.toString()));
  };

  useEffect(() => {
    refresh();                              // 初回
    const id = connection.onSlotChange(refresh);
    return () => connection.removeSlotChangeListener(id);
  }, [publicKey, connection]);

  return (
    <BalanceCtx.Provider value={{ balanceLamports: lamports, refresh }}>
      {children}
    </BalanceCtx.Provider>
  );
}
// --------------------------------------------------
