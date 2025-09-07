import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { IRelayPKP } from '@lit-protocol/types';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { litNodeClient } from '@/utils/user-dashboard/lit';
import { ReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { ConnectPageHeader } from './ui/ConnectPageHeader';
import { ConnectAppHeader } from './ui/ConnectAppHeader';
import { StatusCard } from './ui/StatusCard';
import { ActionButtons } from './ui/ActionButtons';
import { ConnectFooter } from '../ui/Footer';
import { theme } from './ui/theme';
import { InfoBanner } from './ui/InfoBanner';
import { App } from '@/types/developer-dashboard/appTypes';

interface RepermitConnectProps {
  appData: App;
  previouslyPermittedPKP: IRelayPKP;
  readAuthInfo: ReadAuthInfo;
  redirectUri?: string;
}

export function RepermitConnect({ appData, previouslyPermittedPKP, readAuthInfo }: RepermitConnectProps) {
  const navigate = useNavigate();
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const [isConnectProcessing, setIsConnectProcessing] = useState(false);

  // Handle page refresh when repermitting is successful
  useEffect(() => {
    if (localSuccess === 'App re-permitted successfully!') {
      const timer = setTimeout(() => {
        setLocalSuccess('Success! Refreshing...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }, 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [localSuccess]);

  const handleSubmit = useCallback(async () => {
    setLocalError(null);
    setLocalSuccess(null);
    setIsConnectProcessing(true);

    if (!readAuthInfo.authInfo?.userPKP || !readAuthInfo.sessionSigs) {
      setLocalError('Missing authentication information. Please try refreshing the page.');
      setIsConnectProcessing(false);
      return;
    }

    try {
      const userPkpWallet = new PKPEthersWallet({
        controllerSessionSigs: readAuthInfo.sessionSigs,
        pkpPubKey: readAuthInfo.authInfo.userPKP.publicKey,
        litNodeClient: litNodeClient,
      });
      await userPkpWallet.init();

      const client = getClient({ signer: userPkpWallet });
      await client.rePermitApp({
        pkpEthAddress: previouslyPermittedPKP.ethAddress,
        appId: Number(appData.appId),
      });

      setIsConnectProcessing(false);
      setLocalSuccess('App re-permitted successfully!');
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Failed to re-permit app');
      setIsConnectProcessing(false);
    }
  }, [readAuthInfo, previouslyPermittedPKP, appData]);

  const handleDecline = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const isLoading = isConnectProcessing || !!localSuccess;
  const loadingStatus = isConnectProcessing ? 'Re-permitting app...' : localSuccess || null;
  const error = localError;

  return (
    <div
      className={`max-w-md mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden relative z-10 origin-center`}
    >
      {/* Header */}
      <ConnectPageHeader authInfo={readAuthInfo.authInfo!} />

      <div className="px-3 sm:px-4 py-6 sm:py-8 space-y-6">
        {/* App Header */}
        <ConnectAppHeader app={appData} />

        {/* Dividing line */}
        <div className={`border-b ${theme.cardBorder}`}></div>

        {/* Re-permit Information */}
        <div className="space-y-4">
          <InfoBanner
            type="blue"
            title="Previously Connected"
            message="You've previously connected to this app. Re-permitting will restore your previous permissions."
          />
        </div>

        {/* Status Card */}
        <StatusCard
          isLoading={isLoading}
          loadingStatus={loadingStatus}
          error={error}
          success={localSuccess}
        />

        {/* Action Buttons */}
        <ActionButtons
          onDecline={handleDecline}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
          appName={appData.name}
        />
      </div>

      {/* Footer */}
      <ConnectFooter />
    </div>
  );
}