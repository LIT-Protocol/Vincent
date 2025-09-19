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
      <div className="flex items-center mb-3">
        <input
          id="ethToken"
          type="radio"
          checked={!isCustomToken}
          onChange={() => setIsCustomToken(false)}
          className="mr-2 w-3 h-3 text-orange-500 bg-gray-100 border-gray-300 focus:ring-orange-500 dark:focus:ring-orange-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          style={{ accentColor: '#f97316' }}
        />
        <label
          htmlFor="ethToken"
          className={`text-sm cursor-pointer ${!isCustomToken ? 'text-orange-500 font-medium' : 'text-gray-400'}`}
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
          className="mr-2 w-3 h-3 text-orange-500 bg-gray-100 border-gray-300 focus:ring-orange-500 dark:focus:ring-orange-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          style={{ accentColor: '#f97316' }}
        />
        <label
          htmlFor="erc20Token"
          className={`text-sm cursor-pointer ${isCustomToken ? 'text-orange-500 font-medium' : 'text-gray-400'}`}
        >
          Withdraw ERC-20 Token
        </label>
      </div>

      {isCustomToken && (
        <div className={`p-3 border rounded mb-3 ${theme.cardBg} ${theme.cardBorder}`}>
          <h5 className={`text-sm font-medium mb-2 ${theme.text}`}>ERC-20 Token Details</h5>
          <div>
            <label className={`block text-xs mb-1 ${theme.text}`}>Token Address</label>
            <input
              type="text"
              value={customTokenAddress}
              onChange={(e) => setCustomTokenAddress(e.target.value)}
              placeholder="0x..."
              className={`w-full p-2 border rounded text-sm ${theme.cardBg} ${theme.cardBorder} ${theme.text}`}
            />
            <p className={`text-xs ${theme.textMuted} mt-1`}>
              Enter the ERC-20 token contract address. We&apos;ll automatically fetch the token
              details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
