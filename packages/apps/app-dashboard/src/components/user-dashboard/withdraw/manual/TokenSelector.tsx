import React from 'react';
import { theme } from '@/components/user-dashboard/connect/ui/theme';

interface TokenSelectorProps {
  isCustomToken: boolean;
  setIsCustomToken: (value: boolean) => void;
  customTokenAddress: string;
  setCustomTokenAddress: (value: string) => void;
}

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  isCustomToken,
  setIsCustomToken,
  customTokenAddress,
  setCustomTokenAddress,
}) => {
  return (
    <div className="mb-4">
      <h6 className={`text-sm font-medium mb-3 ${theme.text}`}>Asset Type</h6>
      <div className="flex items-center mb-3">
        <input
          id="ethToken"
          type="radio"
          checked={!isCustomToken}
          onChange={() => setIsCustomToken(false)}
          className="mr-2 w-3 h-3 bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600"
          style={{ accentColor: theme.brandOrange }}
        />
        <label
          htmlFor="ethToken"
          className={`text-sm cursor-pointer ${!isCustomToken ? 'font-medium' : 'text-gray-400'}`}
          style={!isCustomToken ? { color: theme.brandOrange } : undefined}
        >
          Withdraw Native Asset
        </label>
      </div>

      <div className="flex items-center mb-3">
        <input
          id="erc20Token"
          type="radio"
          checked={isCustomToken}
          onChange={() => setIsCustomToken(true)}
          className="mr-2 w-3 h-3 bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600"
          style={{ accentColor: theme.brandOrange }}
        />
        <label
          htmlFor="erc20Token"
          className={`text-sm cursor-pointer ${isCustomToken ? 'font-medium' : 'text-gray-400'}`}
          style={isCustomToken ? { color: theme.brandOrange } : undefined}
        >
          Withdraw ERC-20 Token
        </label>
      </div>

      {isCustomToken && (
        <div className="mt-4">
          <div>
            <label className={`block text-xs mb-1 ${theme.text}`}>Token Address</label>
            <input
              type="text"
              value={customTokenAddress}
              onChange={(e) => setCustomTokenAddress(e.target.value)}
              placeholder="0x..."
              className={`w-full p-2 border rounded text-sm ${theme.mainCard} ${theme.cardBorder} ${theme.text}`}
            />
            <p className={`text-xs ${theme.textMuted} mt-1`}>
              Enter the ERC-20 token contract address.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
