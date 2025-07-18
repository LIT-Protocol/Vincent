import { useCallback, useState, useEffect } from 'react';
import { SessionSigs, IRelayPKP } from '@lit-protocol/types';
import { LIT_CHAINS } from '@lit-protocol/constants';
import WalletConnectPage from '@/components/user-dashboard/withdraw/WalletConnect/WalletConnect';
import StatusMessage from '@/components/user-dashboard/consent/StatusMessage';
import { useTheme } from '@/providers/ThemeProvider';
import { theme } from '@/components/user-dashboard/consent/ui/theme';

import { ChainSelector, TokenSelector, WithdrawPanel, BalanceDisplay } from '.';
import { StatusType } from '@/types/shared/StatusType';
import { handleSubmit } from '@/utils/user-dashboard/withdrawHandler';
import { ethers } from 'ethers';

export interface WithdrawFormProps {
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

export default function WithdrawForm({ sessionSigs, agentPKP }: WithdrawFormProps) {
  const { isDark } = useTheme();
  const themeStyles = theme(isDark);
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
  const [activeTab, setActiveTab] = useState<'walletconnect' | 'withdraw'>('walletconnect');
  const [isConfirmationMode, setIsConfirmationMode] = useState<boolean>(false);

  const showStatus = (message: string, type: StatusType = 'info') => {
    setStatusMessage(message);
    setStatusType(type);
  };

  const refreshBalance = useCallback(async () => {
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
    } catch (error: unknown) {
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
    <div className={`max-w-[550px] w-full mx-auto ${themeStyles.cardBg} rounded-xl shadow-lg border ${themeStyles.cardBorder} overflow-hidden`}>
      <div className={`px-6 pt-8 pb-6 border-b ${themeStyles.cardBorder}`}>
        <h3 className={`text-xl font-semibold ${themeStyles.text} mb-6`}>Wallet</h3>

        <div className="mb-4">
          <div className={`text-sm font-medium ${themeStyles.text} mb-2`}>Wallet Information</div>
          <div className={`text-sm font-medium ${themeStyles.text}`}>
            EVM Address: {agentPKP.ethAddress}
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="flex items-center justify-center mb-8 mt-6 px-8">
          <div
            onClick={() => setActiveTab('walletconnect')}
            className={`pb-2 text-lg font-medium transition-colors cursor-pointer select-none ${
              activeTab === 'walletconnect'
                ? `${themeStyles.text} border-b-2 border-orange-500`
                : `${themeStyles.textMuted} hover:${themeStyles.text}`
            }`}
          >
            <div className="flex items-center gap-2 px-3">
              WalletConnect
              <img src="/walletconnect.svg" alt="WalletConnect" width={30} height={40} />
            </div>
          </div>

          <span className={`mx-8 ${themeStyles.textMuted} pointer-events-none text-lg`}>|</span>

          <div
            onClick={() => setActiveTab('withdraw')}
            className={`px-4 pb-2 text-lg font-medium transition-colors cursor-pointer select-none flex items-center gap-2 ${
              activeTab === 'withdraw'
                ? `${themeStyles.text} border-b-2 border-orange-500`
                : `${themeStyles.textMuted} hover:${themeStyles.text}`
            }`}
          >
            Withdraw
            <img src="/logo.svg" alt="Vincent logo" width={20} height={20} />
          </div>
        </div>

        <div className={`mt-0 ${activeTab === 'walletconnect' ? 'block' : 'hidden'}`}>
          <WalletConnectPage agentPKP={agentPKP} sessionSigs={sessionSigs} />
        </div>

        <div className={`space-y-6 mt-0 ${activeTab === 'withdraw' ? 'block' : 'hidden'}`}>
          {statusMessage && <StatusMessage message={statusMessage} type={statusType} />}

          <ChainSelector
            selectedChain={selectedChain}
            ethAddress={agentPKP.ethAddress}
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

          <WithdrawPanel
            withdrawAddress={withdrawAddress}
            setWithdrawAddress={setWithdrawAddress}
            withdrawAmount={withdrawAmount}
            setWithdrawAmount={setWithdrawAmount}
            tokenSymbol={isCustomToken ? 'TOKEN' : nativeToken.symbol}
            loading={loading}
            onSubmit={onSubmit}
            confirmationMode={isConfirmationMode}
            onCancel={onCancel}
          />
        </div>
      </div>
    </div>
  );
}
