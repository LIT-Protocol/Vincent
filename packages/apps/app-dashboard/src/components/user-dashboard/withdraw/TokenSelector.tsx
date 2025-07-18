import React from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { theme } from '@/components/user-dashboard/consent/ui/theme';

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
  const { isDark } = useTheme();
  const themeStyles = theme(isDark);

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
        <label htmlFor="ethToken" className={`${themeStyles.text}`}>Withdraw Native Asset</label>
      </div>

      <div className="flex items-center mb-4">
        <input
          id="erc20Token"
          type="radio"
          checked={isCustomToken}
          onChange={() => setIsCustomToken(true)}
          className="mr-2"
        />
        <label htmlFor="erc20Token" className={`${themeStyles.text}`}>Withdraw ERC-20 Token</label>
      </div>

      {isCustomToken && (
        <div className={`p-4 border rounded mb-4 ${themeStyles.cardBg} ${themeStyles.cardBorder}`}>
          <h5 className={`font-medium mb-3 ${themeStyles.text}`}>ERC-20 Token Details</h5>
          <div>
            <label className={`block text-sm mb-1 ${themeStyles.text}`}>Token Address</label>
            <input
              type="text"
              value={customTokenAddress}
              onChange={(e) => setCustomTokenAddress(e.target.value)}
              placeholder="0x..."
              className={`w-full p-2 border rounded ${themeStyles.cardBg} ${themeStyles.cardBorder} ${themeStyles.text}`}
            />
            <p className={`text-sm ${themeStyles.textMuted} mt-2`}>
              Enter the ERC-20 token contract address. We&apos;ll automatically fetch the token
              details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
