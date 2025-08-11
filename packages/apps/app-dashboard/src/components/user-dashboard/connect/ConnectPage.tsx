import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { ConnectInfoMap } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { useConnectFormData } from '@/hooks/user-dashboard/connect/useConnectFormData';
import { ConnectPageHeader } from './ui/ConnectPageHeader';
import { theme } from './ui/theme';
import { PolicyFormRef } from './ui/PolicyForm';
import { UseReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { useAddPermittedActions } from '@/hooks/user-dashboard/connect/useAddPermittedActions';
import { ConnectAppHeader } from './ui/ConnectAppHeader';
import { AppsInfo } from './ui/AppInfo';
import { ActionButtons } from './ui/ActionButtons';
import { StatusCard } from './ui/StatusCard';
import { ConnectFooter } from '../ui/Footer';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { BigNumber } from 'ethers';
import { litNodeClient, mintPKPToExistingPKP } from '@/utils/user-dashboard/lit';
import { useJwtRedirect } from '@/hooks/user-dashboard/connect/useJwtRedirect';

interface ConnectPageProps {
  connectInfoMap: ConnectInfoMap;
  readAuthInfo: UseReadAuthInfo;
}

export function ConnectPage({ connectInfoMap, readAuthInfo }: ConnectPageProps) {
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
  } = useJwtRedirect({ readAuthInfo });
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
      if (!readAuthInfo.authInfo?.userPKP || !readAuthInfo.sessionSigs) {
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
      const client = getClient({ signer: userPkpWallet });

      let agentPkp;

      try {
        // Use the existing Agent PKPs from auth info
        const existingAgentPkps = readAuthInfo.authInfo.agentPKPs || {};

        // Find an available PKP (one with no permitted apps) or create a new one
        let availablePkp = null;
        for (const pkp of Object.values(existingAgentPkps)) {
          const pkpAppIds = await client.getAllPermittedAppIdsForPkp({
            pkpEthAddress: pkp.ethAddress,
            offset: '0',
          });

          if (pkpAppIds.length === 0) {
            availablePkp = pkp;
            break;
          }
        }

        if (availablePkp) {
          // Reuse available PKP
          agentPkp = availablePkp;
        } else {
          // All PKPs are in use, mint a new one
          const tokenIdString = BigNumber.from(readAuthInfo.authInfo.userPKP.tokenId).toHexString();
          agentPkp = await mintPKPToExistingPKP({
            ...readAuthInfo.authInfo.userPKP,
            tokenId: tokenIdString,
          });
        }
      } catch (error) {
        setLocalError('Failed to fetch Agent PKP information');
        console.log(error);
        setIsConnectProcessing(false);
        return;
      }
      await addPermittedActions({
        wallet: userPkpWallet,
        agentPKPTokenId: agentPkp.tokenId,
        abilityIpfsCids: Object.keys(formData),
      });

      try {
        await client.permitApp({
          pkpEthAddress: agentPkp.ethAddress,
          appId: Number(connectInfoMap.app.appId),
          appVersion: Number(connectInfoMap.app.activeVersion),
          permissionData: formData,
        });

        setIsConnectProcessing(false);
        // Show success state for 3 seconds, then redirect
        setLocalSuccess('Permissions granted successfully!');
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
