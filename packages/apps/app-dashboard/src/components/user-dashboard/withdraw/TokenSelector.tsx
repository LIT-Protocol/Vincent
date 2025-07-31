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
    <div className="mb-6">
      <div className="flex items-center mb-4">
        <input
          id="ethToken"
          type="radio"
          checked={!isCustomToken}
          onChange={() => setIsCustomToken(false)}
          className="mr-2"
        />
        <label htmlFor="ethToken" className={`${theme.text}`}>
          Withdraw Native Asset
        </label>
      </div>

      <div className="flex items-center mb-4">
        <input
          id="erc20Token"
          type="radio"
          checked={isCustomToken}
          onChange={() => setIsCustomToken(true)}
          className="mr-2"
        />
        <label htmlFor="erc20Token" className={`${theme.text}`}>
          Withdraw ERC-20 Token
        </label>
      </div>

      {isCustomToken && (
        <div className={`p-4 border rounded mb-4 ${theme.cardBg} ${theme.cardBorder}`}>
          <h5 className={`font-medium mb-3 ${theme.text}`}>ERC-20 Token Details</h5>
          <div>
            <label className={`block text-sm mb-1 ${theme.text}`}>Token Address</label>
            <input
              type="text"
              value={customTokenAddress}
              onChange={(e) => setCustomTokenAddress(e.target.value)}
              placeholder="0x..."
              className={`w-full p-2 border rounded ${theme.cardBg} ${theme.cardBorder} ${theme.text}`}
            />
            <p className={`text-sm ${theme.textMuted} mt-2`}>
              Enter the ERC-20 token contract address. We&apos;ll automatically fetch the token
              details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
