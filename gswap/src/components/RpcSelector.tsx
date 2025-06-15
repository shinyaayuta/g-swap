// gswap/src/components/RpcSelector.tsx
"use client";
import { useSolanaConnection } from "@/hooks/useSolanaConnection";

export default function RpcSelector() {
  const { endpoint, setEndpoint, endpoints } = useSolanaConnection();
  return (
    <select
      className="rpc-selector mb-4 px-3 py-2 bg-gray-800 rounded"
      value={endpoint}
      onChange={(e) => setEndpoint(e.target.value)}
    >
      {endpoints.map((url) => (
        <option key={url} value={url}>
          {new URL(url).hostname}
        </option>
      ))}
    </select>
  );
}
