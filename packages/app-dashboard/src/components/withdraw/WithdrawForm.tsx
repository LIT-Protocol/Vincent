import { useCallback, useState, useEffect } from 'react';
import { SessionSigs, IRelayPKP } from '@lit-protocol/types';
import { LIT_CHAINS } from '@lit-protocol/constants';
import WalletConnectPage from '@/components/withdraw/WalletConnect/WalletConnect';

import {
  FormHeader,
  StatusMessage,
  WalletInfo,
  StatusType,
  ChainSelector,
  TokenSelector,
  WithdrawPanel,
  BalanceDisplay,
} from '.';
import { handleSubmit } from './WalletConnect/withdrawHandler';
import { ethers } from 'ethers';
import BackButton from './WalletConnect/BackButton';
import { Button } from '@/components/ui/button';

export interface WithdrawFormProps {
  sessionSigs: SessionSigs;
  agentPKP?: IRelayPKP;
  isSessionValidation?: boolean;
  userPKP?: IRelayPKP;
  shouldRefreshBalances?: boolean;
}

export interface TokenDetails {
  address: string;
  symbol: string;
  decimals: number;
}

export default function WithdrawForm({ sessionSigs, agentPKP }: WithdrawFormProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedChain, setSelectedChain] = useState<string>('ethereum');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<StatusType>('info');
  const [isCustomToken, setIsCustomToken] = useState<boolean>(false);
  const [customTokenAddress, setCustomTokenAddress] = useState<string>('');
  const [nativeBalance, setNativeBalance] = useState<string>('0');
  const [nativeToken, setNativeToken] = useState<TokenDetails>({
    address: '',
    symbol: '',
    decimals: 18,
  });
  const [showWalletConnect, setShowWalletConnect] = useState<boolean>(false);

  const showStatus = (message: string, type: StatusType = 'info') => {
    setStatusMessage(message);
    setStatusType(type);
  };

  const refreshBalance = useCallback(async () => {
    setLoading(true);
    const chain = LIT_CHAINS[selectedChain]; // Chains are only from the dropdown
    const rpcUrl = chain.rpcUrls[0]; // rpcUrl is a require prop for chains
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
    } catch (error: unknown) {
      showStatus(`Error: ${(error as Error).message || 'Error fetching balance'}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [agentPKP, selectedChain]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  // Handle submission
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await handleSubmit(
      isCustomToken,
      customTokenAddress,
      withdrawAmount,
      withdrawAddress,
      agentPKP!,
      sessionSigs,
      selectedChain,
      setLoading,
      showStatus,
    );

    if (result.success) {
      refreshBalance();
    }
  };

  return (
    <div className="max-w-[550px] w-full mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {showWalletConnect ? (
        <div className="p-6">
          <div className="mb-4">
            <BackButton label="Back to withdraw" onClick={() => setShowWalletConnect(false)} />
          </div>
          <WalletConnectPage agentPKP={agentPKP} sessionSigs={sessionSigs} />
        </div>
      ) : (
        <>
          <FormHeader />
          <h3 className="text-lg font-medium text-black mb-4 mt-8 px-6">Account Fund Manager</h3>

          <StatusMessage message={statusMessage} type={statusType} />

          <WalletInfo ethAddress={agentPKP?.ethAddress} />

          <div className="p-6">
            <ChainSelector
              selectedChain={selectedChain}
              ethAddress={agentPKP!.ethAddress}
              onChange={setSelectedChain}
            />

            <BalanceDisplay
              balance={nativeBalance}
              token={nativeToken}
              loading={loading}
              refreshBalance={refreshBalance}
            />

            <TokenSelector
              isCustomToken={isCustomToken}
              setIsCustomToken={setIsCustomToken}
              customTokenAddress={customTokenAddress}
              setCustomTokenAddress={setCustomTokenAddress}
            />

            <div className="mb-4">
              <Button
                variant="outline"
                onClick={() => setShowWalletConnect(true)}
                className="h-8 px-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
              >
                Connect with WalletConnect
              </Button>
            </div>

            <WithdrawPanel
              withdrawAddress={withdrawAddress}
              setWithdrawAddress={setWithdrawAddress}
              withdrawAmount={withdrawAmount}
              setWithdrawAmount={setWithdrawAmount}
              tokenSymbol={isCustomToken ? 'TOKEN' : nativeToken.symbol}
              loading={loading}
              onSubmit={onSubmit}
            />
          </div>
        </>
      )}
    </div>
  );
}
