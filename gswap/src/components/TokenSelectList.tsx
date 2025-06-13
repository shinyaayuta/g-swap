// src/components/TokenSelectList.tsx

import React, { useState } from 'react';

// ★修正点1: Token インターフェースに logoURI と isNative を追加
interface Token {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
  logoURI?: string; // トークンのアイコンURL (オプション)
  isNative?: boolean; // ネイティブSOL (WSOL) を識別するためのフラグ (オプション)
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
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    token.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="token-select-button" 
      >
        {/* ★修正点2: 選択されたトークンのアイコン表示を追加 */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {selectedToken?.logoURI && ( // logoURI が存在する場合のみ画像を表示
            <img 
              src={selectedToken.logoURI} 
              alt={selectedToken.symbol} 
              style={{ width: '24px', height: '24px', marginRight: '8px', borderRadius: '50%' }} 
            />
          )}
          <span>{selectedToken ? selectedToken.symbol : 'Select Token'}</span>
        </div>
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
              // ★修正点3: リストアイテムのアイコンとテキストを横並びにするためのスタイルを追加
              style={{ display: 'flex', alignItems: 'center' }} 
            >
              {/* ★修正点4: リストアイテムのアイコン表示を追加 */}
              {token.logoURI && ( // logoURI が存在する場合のみ画像を表示
                <img 
                  src={token.logoURI} 
                  alt={token.symbol} 
                  style={{ width: '20px', height: '20px', marginRight: '8px', borderRadius: '50%' }} 
                />
              )}
              {token.symbol} ({token.name})
            </div>
          ))}
          {filteredTokens.length === 0 && <p className="p-2 text-gray-400">No tokens found.</p>} 
        </div>
      )}
    </div>
  );
};

export default TokenSelectList;