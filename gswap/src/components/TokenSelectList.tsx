// src/components/TokenSelectList.tsx

import React, { useState } from 'react';

interface Token {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
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
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) || // nameも検索対象に
    token.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="token-select-button" 
      >
        <span>{selectedToken ? selectedToken.symbol : 'Select Token'}</span>
        <span>▼</span>
      </button>

      {isOpen && (
        <div className="token-select-dropdown"> 
          <input
            type="text"
            placeholder="Search token..."
            className="token-search-input" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {filteredTokens.map((token) => (
            <div
              key={token.address}
              className="token-list-item" 
              onClick={() => {
                onSelect(token);
                setIsOpen(false);
                setSearchTerm('');
              }}
            >
              {token.symbol} ({token.name})
            </div>
          ))}
          {filteredTokens.length === 0 && <p className="p-2 text-gray-400">No tokens found.</p>} {/* <-- この部分はglobals.cssで定義されたクラス */}
        </div>
      )}
    </div>
  );
};

export default TokenSelectList;