// src/hooks/useSolanaConnection.ts
import { useState, useEffect, useCallback } from 'react';
import { Connection } from '@solana/web3.js';
import { toast } from 'react-hot-toast';
import { SOLANA_RPC_URLS, SOLANA_CLUSTER } from '../utils/constants'; // SOLANA_CLUSTERもインポート

interface UseSolanaConnection {
  connection: Connection | null;
  currentRpcUrl: string | null;
  isConnected: boolean;
  error: string | null;
  setConnection: (url: string) => void;
  reconnect: () => void;
}

export const useSolanaConnection = (): UseSolanaConnection => {
  const [connection, setConnectionState] = useState<Connection | null>(null);
  const [currentRpcUrl, setCurrentRpcUrl] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRpcIndex, setCurrentRpcIndex] = useState(0);

  const establishConnection = useCallback(async (url: string) => {
    try {
      // clusterApiUrlは使わず、直接URLを指定
      const newConnection = new Connection(url, 'confirmed');
      const health = await newConnection.getHealth();
      if (health === 'ok') {
        setConnectionState(newConnection);
        setCurrentRpcUrl(url);
        setIsConnected(true);
        setError(null);
        toast.success(`RPC接続に成功しました: ${url}`);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error(`Failed to connect to RPC: ${url}`, err);
      setError(`RPC接続エラー: ${url} (${err.message})`);
      setIsConnected(false);
      return false;
    }
  }, []);

  const setConnection = useCallback((url: string) => {
    setCurrentRpcUrl(url); // 選択されたURLを保持
    setConnectionState(new Connection(url, 'confirmed')); // 新しいConnectionインスタンスを作成
    setIsConnected(false); // 再接続が必要になるためfalseに
    establishConnection(url); // 新しいURLで接続を試みる
  }, [establishConnection]);

  const reconnect = useCallback(async () => {
    setError(null);
    setIsConnected(false);
    let connected = false;
    // SOLANA_RPC_URLSが空の場合に備える
    if (SOLANA_RPC_URLS.length === 0) {
      toast.error('RPCエンドポイントが設定されていません。');
      setError('RPCエンドポイントが設定されていません。');
      return;
    }

    for (let i = 0; i < SOLANA_RPC_URLS.length; i++) {
      const url = SOLANA_RPC_URLS[(currentRpcIndex + i) % SOLANA_RPC_URLS.length];
      toast.loading(`RPCを試行中: ${url}...`, { id: 'rpc-connect' });
      connected = await establishConnection(url);
      toast.dismiss('rpc-connect');
      if (connected) {
        setCurrentRpcIndex((currentRpcIndex + i) % SOLANA_RPC_URLS.length);
        break;
      }
    }
    if (!connected) {
      toast.error('全てのRPC接続に失敗しました。');
    }
  }, [currentRpcIndex, establishConnection]);

  useEffect(() => {
    reconnect(); // コンポーネントマウント時に初期接続を試みる
  }, [reconnect]);

  return { connection, currentRpcUrl, isConnected, error, setConnection, reconnect };
};