import { useState, useCallback, useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { IRelayPKP } from '@lit-protocol/types';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { litNodeClient } from '@/utils/user-dashboard/lit';
import { ReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { useJwtRedirect } from '@/hooks/user-dashboard/connect/useJwtRedirect';
import { useUrlRedirectUri } from '@/hooks/user-dashboard/connect/useUrlRedirectUri';
import { ConnectAppHeader } from '../connect/ui/ConnectAppHeader';
import { StatusCard } from '../connect/ui/StatusCard';
import { ActionButtons } from '../connect/ui/ActionButtons';
import { theme } from '../connect/ui/theme';
import { InfoBanner } from '../connect/ui/InfoBanner';
import { PageHeader } from './ui/PageHeader';
import { App } from '@/types/developer-dashboard/appTypes';
import { useNavigate } from 'react-router-dom';

interface RepermitConnectPageProps {
  appData: App;
  previouslyPermittedPKP: IRelayPKP;
  readAuthInfo: ReadAuthInfo;
}

export function RepermitConnectPage({
  appData,
  previouslyPermittedPKP,
  readAuthInfo,
}: RepermitConnectPageProps) {
  const navigate = useNavigate();
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const [isConnectProcessing, setIsConnectProcessing] = useState(false);

  // Check if there's a redirectUri in URL for redirect logic
  const { redirectUri } = useUrlRedirectUri();

  // Use the first authorized redirect URI if no redirectUri in URL
  const effectiveRedirectUri = redirectUri || appData.redirectUris?.[0];

  const {
    generateJWT,
    executeRedirect,
    isLoading: isJwtLoading,
    loadingStatus: jwtLoadingStatus,
    error: jwtError,
    redirectUrl,
  } = useJwtRedirect({
    readAuthInfo,
    agentPKP: previouslyPermittedPKP,
    redirectUriOverride: effectiveRedirectUri,
  });

  // Handle redirect when JWT is ready
  useEffect(() => {
    if (redirectUrl && !localSuccess) {
      setLocalSuccess('Success! Redirecting to app...');
      setTimeout(() => {
        executeRedirect();
      }, 2000);
    }
  }, [redirectUrl, localSuccess, executeRedirect]);

  const handleSubmit = useCallback(async () => {
    setLocalError(null);
    setLocalSuccess(null);
    setIsConnectProcessing(true);

    if (!readAuthInfo.authInfo?.userPKP || !readAuthInfo.sessionSigs) {
      setLocalError('Missing authentication information. Please try refreshing the page.');
      setIsConnectProcessing(false);
      Sentry.captureMessage(
        'Missing authentication information in the permitted apps page',
        'warning',
      );
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

      // Generate JWT for redirect after short delay
      setTimeout(async () => {
        setLocalSuccess(null);
        // Only generate JWT if there's an effectiveRedirectUri (for app redirects)
        if (effectiveRedirectUri) {
          await generateJWT(appData, appData.activeVersion!);
        } else {
          // Navigate to the app permissions page with full refresh to update sidebar
          window.location.href = `/user/appId/${appData.appId}`;
        }
      }, 3000);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Failed to re-permit app');
      setIsConnectProcessing(false);
      Sentry.captureException(error, {
        extra: {
          context: 'RepermitConnectPage.handleSubmit',
          appId: appData.appId,
          pkpAddress: previouslyPermittedPKP.ethAddress,
        },
      });
      return;
    }
  }, [readAuthInfo, previouslyPermittedPKP, appData, effectiveRedirectUri, generateJWT]);

  const handleDecline = useCallback(() => {
    navigate(`/user/appId/${appData.appId}`);
  }, [appData.appId, navigate]);

  const isLoading = isJwtLoading || isConnectProcessing || !!localSuccess;
  const loadingStatus =
    jwtLoadingStatus || (isConnectProcessing ? 'Re-permitting app...' : localSuccess || null);
  const error = jwtError || localError;

  return (
    <div
      className={`w-full max-w-md mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden relative z-10 origin-center`}
    >
      {/* Page Header */}
      <PageHeader
        icon={
          <svg
            className="w-4 h-4 text-orange-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        }
        title="Re-permit App"
        description="Restore your previous permissions for this app"
        linkUrl={appData.appUserUrl}
        linkText="Open App"
      />

      <div className="px-3 sm:px-4 py-6 sm:py-8 space-y-6">
        {/* App Header */}
        <ConnectAppHeader app={appData} />

        {/* Re-permit Information */}
        <InfoBanner
          type="blue"
          title="Previously Connected"
          message="You've previously connected to this app. Re-permitting will restore your previous permissions."
        />

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
    </div>
  );
}
