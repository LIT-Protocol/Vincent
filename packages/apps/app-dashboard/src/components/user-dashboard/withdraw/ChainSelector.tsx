import React from 'react';
import { LIT_CHAINS } from '@lit-protocol/constants';
import { useTheme } from '@/providers/ThemeProvider';
import { theme } from '@/components/user-dashboard/consent/ui/theme';

interface ChainSelectorProps {
  selectedChain: string;
  ethAddress: string;
  onChange: (chain: string) => void;
}

interface ChainSelectorResult {
  value: string;
  label: string;
  blockExplorerUrl: string;
}

export const ChainSelector: React.FC<ChainSelectorProps> = ({
  selectedChain,
  ethAddress,
  onChange,
}) => {
  const { isDark } = useTheme();
  const themeStyles = theme(isDark);

  const chainOptionsDict = Object.entries(LIT_CHAINS).reduce(
    (acc, [key, chain]) => {
      acc[key] = {
        value: key,
        label: chain.name,
        blockExplorerUrl: chain.blockExplorerUrls[0],
      };
      return acc;
    },
    {} as Record<string, ChainSelectorResult>,
  );

  const selectedChainOption = chainOptionsDict[selectedChain];
  const explorerUrl = selectedChainOption?.blockExplorerUrl;

  return (
    <div className="mb-6">
      <label className={`block text-sm font-medium mb-2 ${themeStyles.text}`}>Select Network</label>
      <select
        className={`w-full p-2 border rounded ${themeStyles.cardBg} ${themeStyles.cardBorder} ${themeStyles.text}`}
        value={selectedChain}
        onChange={(e) => onChange(e.target.value)}
      >
        {Object.values(chainOptionsDict)
          .sort((a, b) => a.label.localeCompare(b.label))
          .map((chain) => (
            <option key={chain.value} value={chain.value}>
              {chain.label}
            </option>
          ))}
      </select>

      {explorerUrl && ethAddress && (
        <div className="mt-2 text-sm">
          <a
            href={`${explorerUrl}/address/${ethAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${themeStyles.linkColor} underline flex items-center`}
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            View on {selectedChainOption?.label} block explorer
          </a>
        </div>
      )}
    </div>
  );
};
