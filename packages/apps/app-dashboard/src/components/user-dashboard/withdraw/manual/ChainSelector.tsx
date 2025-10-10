import React from 'react';
import { LIT_CHAINS } from '@lit-protocol/constants';
import { theme } from '@/components/user-dashboard/connect/ui/theme';

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
    <div>
      <select
        className={`w-full p-2 border rounded text-sm ${theme.mainCard} ${theme.cardBorder} ${theme.text}`}
        value={selectedChain}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>
          Select Network
        </option>
        {Object.values(chainOptionsDict)
          .sort((a, b) => a.label.localeCompare(b.label))
          .map((chain) => (
            <option key={chain.value} value={chain.value}>
              {chain.label}
            </option>
          ))}
      </select>

      {explorerUrl && ethAddress && (
        <div className="mt-2 text-xs">
          <a
            href={`${explorerUrl}/address/${ethAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline flex items-center"
            style={{ color: theme.brandOrange }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
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
            {selectedChainOption?.label} block explorer
          </a>
        </div>
      )}
    </div>
  );
};
