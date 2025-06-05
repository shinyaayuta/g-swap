// src/components/TokenSelectList.tsx

import React, { useState } from 'react';

interface Token {
  address: string;
  symbol: string;
  decimals: number;
  // 他のトークン情報
}

interface TokenSelectListProps {
  selectedToken: Token | null;
  onSelect: (token: Token) => void;
  tokens: Token[];
}

const TokenSelectList: React.FC<TokenSelectListProps> = ({ selectedToken, onSelect, tokens }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTokens = tokens.filter(token =>
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-700 text-white py-2 px-4 rounded w-full text-left flex justify-between items-center"
      >
        <span>{selectedToken ? selectedToken.symbol : 'Select Token'}</span>
        <span>▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-10 bg-gray-700 border border-gray-600 rounded mt-1 w-full max-h-60 overflow-y-auto">
          <input
            type="text"
            placeholder="Search token..."
            className="w-full p-2 bg-gray-800 border-b border-gray-600 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {filteredTokens.map((token) => (
            <div
              key={token.address}
              className="p-2 hover:bg-gray-600 cursor-pointer text-white"
              onClick={() => {
                onSelect(token);
                setIsOpen(false);
                setSearchTerm('');
              }}
            >
              {token.symbol} ({token.address.substring(0, 6)}...)
            </div>
          ))}
          {filteredTokens.length === 0 && <p className="p-2 text-gray-400">No tokens found.</p>}
        </div>
      )}
    </div>
  );
};

export default TokenSelectList;