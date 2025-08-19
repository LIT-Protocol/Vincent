import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { IRelayPKP } from '@lit-protocol/types';
import { ConnectInfoMap } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { useConnectFormData } from '@/hooks/user-dashboard/connect/useConnectFormData';
import { ConnectPageHeader } from './ui/ConnectPageHeader';
import { theme } from './ui/theme';
import { PolicyFormRef } from './ui/PolicyForm';
import { ReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { useAddPermittedActions } from '@/hooks/user-dashboard/connect/useAddPermittedActions';
import { ConnectAppHeader } from './ui/ConnectAppHeader';
import { AppsInfo } from './ui/AppInfo';
import { ActionButtons } from './ui/ActionButtons';
import { StatusCard } from './ui/StatusCard';
import { ConnectFooter } from '../ui/Footer';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { litNodeClient, mintPKPToExistingPKP } from '@/utils/user-dashboard/lit';
import { useJwtRedirect } from '@/hooks/user-dashboard/connect/useJwtRedirect';
import { BigNumber } from 'ethers';

interface ConnectPageProps {
  connectInfoMap: ConnectInfoMap;
  readAuthInfo: ReadAuthInfo;
  agentPKP: IRelayPKP;
  isLastUnpermittedPKP: boolean;
}

export function ConnectPage({
  connectInfoMap,
  readAuthInfo,
  agentPKP,
  isLastUnpermittedPKP,
}: ConnectPageProps) {
  const navigate = useNavigate();
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const [isConnectProcessing, setIsConnectProcessing] = useState(false);
  const formRefs = useRef<Record<string, PolicyFormRef>>({});

  const { formData, handleFormChange } = useConnectFormData(connectInfoMap);
  const {
    generateJWT,
    executeRedirect,
    isLoading: isJwtLoading,
    loadingStatus: jwtLoadingStatus,
    error: jwtError,
    redirectUrl,
  } = useJwtRedirect({ readAuthInfo, agentPKP });
  const {
    addPermittedActions,
    isLoading: isActionsLoading,
    loadingStatus: actionsLoadingStatus,
    error: actionsError,
  } = useAddPermittedActions();

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
    // Clear any previous local errors
    setLocalError(null);
    setLocalSuccess(null);
    setIsConnectProcessing(true);

    // Check if all forms are valid using RJSF's built-in validateForm method
    const allValid = Object.values(formRefs.current).every((formRef) => {
      return formRef.validateForm();
    });

    if (allValid) {
      if (!agentPKP || !readAuthInfo.authInfo?.userPKP || !readAuthInfo.sessionSigs) {
        setLocalError('Missing authentication information. Please try refreshing the page.');
        setIsConnectProcessing(false);
        return;
      }

      console.log('formData', formData);

      const userPkpWallet = new PKPEthersWallet({
        controllerSessionSigs: readAuthInfo.sessionSigs,
        pkpPubKey: readAuthInfo.authInfo.userPKP.publicKey,
        litNodeClient: litNodeClient,
      });
      await userPkpWallet.init();

      await addPermittedActions({
        wallet: userPkpWallet,
        agentPKPTokenId: agentPKP.tokenId,
        abilityIpfsCids: Object.keys(formData),
      });

      try {
        const client = getClient({ signer: userPkpWallet });
        await client.permitApp({
          pkpEthAddress: agentPKP.ethAddress,
          appId: Number(connectInfoMap.app.appId),
          appVersion: Number(connectInfoMap.app.activeVersion),
          permissionData: formData,
        });

        setIsConnectProcessing(false);

        // If this was the last unpermitted PKP, mint a new one for future apps
        if (isLastUnpermittedPKP) {
          const tokenIdString = BigNumber.from(readAuthInfo.authInfo.userPKP.tokenId).toHexString();
          await mintPKPToExistingPKP({
            ...readAuthInfo.authInfo.userPKP,
            tokenId: tokenIdString,
          });
        }

        // Show success state for 3 seconds, then redirect
        setLocalSuccess('Permissions granted successfully!');
        setIsConnectProcessing(false);
        setTimeout(async () => {
          setLocalSuccess(null);
          await generateJWT(connectInfoMap.app, connectInfoMap.app.activeVersion!); // ! since this will be valid. Only optional in the schema doc for init creation.
        }, 3000);
      } catch (error) {
        setLocalError(error instanceof Error ? error.message : 'Failed to permit app');
        setIsConnectProcessing(false);
        return;
      }
    } else {
      setLocalError('Some of your permissions are not valid. Please check the form and try again.');
      setIsConnectProcessing(false);
    }
  }, [formData, readAuthInfo, addPermittedActions, generateJWT, connectInfoMap.app]);

  const handleDecline = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const registerFormRef = useCallback((policyIpfsCid: string, ref: PolicyFormRef) => {
    formRefs.current[policyIpfsCid] = ref;
  }, []);

  const isLoading = isJwtLoading || isActionsLoading || isConnectProcessing || !!localSuccess;
  const loadingStatus =
    jwtLoadingStatus ||
    actionsLoadingStatus ||
    (isConnectProcessing ? 'Processing connect...' : null);
  const error = jwtError || actionsError || localError;

  return (
    <div
      className={`max-w-md mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden relative z-10 origin-center`}
    >
      {/* Header */}
      <ConnectPageHeader authInfo={readAuthInfo.authInfo!} />

      <div className="px-3 sm:px-4 py-6 sm:py-8 space-y-6">
        {/* App Header */}
        <ConnectAppHeader app={connectInfoMap.app} />

        {/* Dividing line */}
        <div className={`border-b ${theme.cardBorder}`}></div>

        {/* Apps and Versions */}
        <AppsInfo
          connectInfoMap={connectInfoMap}
          formData={formData}
          onFormChange={handleFormChange}
          onRegisterFormRef={registerFormRef}
        />

        {/* Status Card */}
        <StatusCard
          isLoading={isLoading}
          loadingStatus={loadingStatus}
          error={error || localError}
          success={localSuccess}
        />

        {/* Action Buttons */}
        <ActionButtons
          onDecline={handleDecline}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error || localError}
          appName={connectInfoMap.app.name}
        />
      </div>

      {/* Footer */}
      <ConnectFooter />
    </div>
  );
}
