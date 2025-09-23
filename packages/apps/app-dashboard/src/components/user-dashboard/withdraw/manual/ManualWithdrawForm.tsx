import { useCallback, useState, useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { SessionSigs, IRelayPKP } from '@lit-protocol/types';
import { LIT_CHAINS } from '@lit-protocol/constants';
import StatusMessage from '@/components/user-dashboard/connect/StatusMessage';
import { theme } from '@/components/user-dashboard/connect/ui/theme';

import { ChainSelector } from './ChainSelector';
import { WithdrawPanel } from './ManualWithdraw';
import { Button } from '@/components/shared/ui/button';
import { StatusType } from '@/types/shared/StatusType';
import { handleSubmit } from '@/utils/user-dashboard/withdrawHandler';
import { ethers } from 'ethers';

export interface ManualWithdrawProps {
  sessionSigs: SessionSigs;
  agentPKP: IRelayPKP;
  isSessionValidation?: boolean;
  userPKP?: IRelayPKP;
  shouldRefreshBalances?: boolean;
}

export interface TokenDetails {
  address: string;
  symbol: string;
  decimals: number;
}

export const ManualWithdraw: React.FC<ManualWithdrawProps> = ({ sessionSigs, agentPKP }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedChain, setSelectedChain] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<StatusType>('info');
  const [statusLink, setStatusLink] = useState<{ url: string; text: string } | null>(null);
  const [isCustomToken, setIsCustomToken] = useState<boolean>(false);
  const [customTokenAddress, setCustomTokenAddress] = useState<string>('');
  const [nativeBalance, setNativeBalance] = useState<string>('0');
  const [nativeToken, setNativeToken] = useState<TokenDetails>({
    address: '',
    symbol: '',
    decimals: 18,
  });
  const [isConfirmationMode, setIsConfirmationMode] = useState<boolean>(false);

  const showStatus = (
    message: string,
    type: StatusType = 'info',
    link?: { url: string; text: string },
  ) => {
    setStatusMessage(message);
    setStatusType(type);
    setStatusLink(link || null);

    // Clear success messages after 10 seconds
    if (type === 'success' && message.includes('withdrawal confirmed')) {
      setTimeout(() => {
        setStatusMessage(null);
        setStatusLink(null);
      }, 10000);
    }
  };

  const refreshBalance = useCallback(async () => {
    if (!selectedChain) {
      return;
    }
    setLoading(true);
    const chain = LIT_CHAINS[selectedChain];
    const rpcUrl = chain.rpcUrls[0];
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    try {
      const result = await provider.getBalance(agentPKP!.ethAddress);
      setNativeBalance(ethers.utils.formatUnits(result, chain.decimals));
      const token = {
        address: chain.contractAddress!,
        symbol: chain.symbol,
        decimals: chain.decimals,
      };
      setNativeToken(token);
      showStatus('Balance successfully fetched', 'success');
    } catch (error) {
      Sentry.captureException(error);
      showStatus(`Error: ${(error as Error).message || 'Error fetching balance'}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [agentPKP, selectedChain]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await handleSubmit(
      isCustomToken,
      customTokenAddress,
      withdrawAmount,
      withdrawAddress,
      agentPKP,
      sessionSigs,
      selectedChain,
      setLoading,
      showStatus,
      isConfirmationMode,
    );

    if (result.success && result.needsConfirmation) {
      setIsConfirmationMode(true);
    } else if (result.success) {
      setIsConfirmationMode(false);
      setTimeout(() => {
        refreshBalance();
      }, 5000);
    }
  };

  const onCancel = () => {
    setIsConfirmationMode(false);
    showStatus('Transaction cancelled', 'success');
  };

  return (
    <div className="space-y-4">
      {statusMessage && (
        <StatusMessage message={statusMessage} type={statusType} link={statusLink || undefined} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 lg:items-start">
        <div className="flex flex-col h-full">
          <h5 className={`text-sm font-medium mb-3 ${theme.text}`}>Network</h5>
          <div
            className={`p-4 border rounded ${theme.cardBg} ${theme.cardBorder} flex-1 flex flex-col justify-center`}
          >
            <ChainSelector
              selectedChain={selectedChain}
              ethAddress={agentPKP.ethAddress}
              onChange={setSelectedChain}
            />
          </div>
        </div>

        <div className="flex flex-col h-full">
          <h5 className={`text-sm font-medium mb-3 ${theme.text}`}>Your Native Token Balance</h5>
          <div
            className={`p-4 border rounded ${theme.cardBg} ${theme.cardBorder} flex-1 flex flex-col justify-center`}
          >
            <div className="text-center">
              <div className={`text-sm font-semibold ${theme.text} mb-3`}>
                {nativeBalance} {nativeToken.symbol}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshBalance}
                disabled={loading}
                className={`px-2 py-0.5 text-xs ${theme.text} border ${theme.cardBorder} hover:${theme.itemHoverBg}`}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <h5 className={`text-sm font-medium mb-3 ${theme.text}`}>Withdrawal Details</h5>
      <WithdrawPanel
        withdrawAddress={withdrawAddress}
        setWithdrawAddress={setWithdrawAddress}
        withdrawAmount={withdrawAmount}
        setWithdrawAmount={setWithdrawAmount}
        tokenSymbol={nativeToken.symbol}
        loading={loading}
        onSubmit={onSubmit}
        confirmationMode={isConfirmationMode}
        onCancel={onCancel}
        isCustomToken={isCustomToken}
        setIsCustomToken={setIsCustomToken}
        customTokenAddress={customTokenAddress}
        setCustomTokenAddress={setCustomTokenAddress}
      />
    </div>
  );
};
