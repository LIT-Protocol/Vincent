import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Sentry from '@sentry/react';
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
import { addPayee } from '@/utils/user-dashboard/addPayee';
import { usePendingAppConnectPkp } from '@/hooks/user-dashboard/connect/usePendingAppConnectPkp';

interface ConnectPageProps {
  connectInfoMap: ConnectInfoMap;
  readAuthInfo: ReadAuthInfo;
  previouslyPermittedPKP?: IRelayPKP | null;
}

export function ConnectPage({
  connectInfoMap,
  readAuthInfo,
  previouslyPermittedPKP,
}: ConnectPageProps) {
  const navigate = useNavigate();
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const [isConnectProcessing, setIsConnectProcessing] = useState(false);
  const [agentPKP, setAgentPKP] = useState<IRelayPKP | null>(null);
  const formRefs = useRef<Record<string, PolicyFormRef>>({});
  const { pendingPKP, setPendingPKP, clearPendingPKP } = usePendingAppConnectPkp(
    connectInfoMap.app.appId,
  );

  const {
    formData,
    selectedPolicies,
    handleFormChange,
    handlePolicySelectionChange,
    getSelectedFormData,
  } = useConnectFormData(connectInfoMap);
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

  // Generate JWT when agentPKP is set and permissions are granted
  useEffect(() => {
    if (agentPKP && localSuccess === 'Permissions granted successfully!') {
      const timer = setTimeout(async () => {
        setLocalSuccess(null);
        await generateJWT(connectInfoMap.app, connectInfoMap.app.activeVersion!);
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [agentPKP, localSuccess, generateJWT, connectInfoMap.app]);

  const handleSubmit = useCallback(async () => {
    // Clear any previous local errors
    setLocalError(null);
    setLocalSuccess(null);
    setIsConnectProcessing(true);

    // Check if all forms for selected policies are valid using RJSF's built-in validateForm method
    const allValid = Object.keys(formRefs.current).every((policyIpfsCid) => {
      // Only validate forms for selected policies
      if (!selectedPolicies[policyIpfsCid]) {
        return true; // Skip validation for unselected policies
      }
      return formRefs.current[policyIpfsCid].validateForm();
    });

    if (allValid) {
      if (!readAuthInfo.authInfo?.userPKP || !readAuthInfo.sessionSigs) {
        setLocalError('Missing authentication information. Please try refreshing the page.');
        setIsConnectProcessing(false);
        return;
      }

      const selectedFormData = getSelectedFormData();
      console.log(
        'selectedFormData',
        JSON.stringify(
          selectedFormData,
          (_, value) => (value === undefined ? 'undefined' : value),
          2,
        ),
      );

      const userPkpWallet = new PKPEthersWallet({
        controllerSessionSigs: readAuthInfo.sessionSigs,
        pkpPubKey: readAuthInfo.authInfo.userPKP.publicKey,
        litNodeClient: litNodeClient,
      });
      await userPkpWallet.init();

      let agentPKP: IRelayPKP | undefined;

      // Check for pending PKP or use previously permitted PKP
      if (pendingPKP) {
        console.log('Found pending PKP from previous attempt:', pendingPKP.ethAddress);
        agentPKP = pendingPKP;
      } else if (previouslyPermittedPKP) {
        console.log('Reusing previously permitted PKP:', previouslyPermittedPKP.ethAddress);
        agentPKP = previouslyPermittedPKP;
      } else {
        // Step 1: Mint new PKP
        try {
          const tokenIdString = BigNumber.from(readAuthInfo.authInfo.userPKP.tokenId).toHexString();
          agentPKP = await mintPKPToExistingPKP({
            ...readAuthInfo.authInfo.userPKP,
            tokenId: tokenIdString,
          });
          console.log('Minted new PKP:', agentPKP.ethAddress);

          // Save to localStorage in case we fail in subsequent steps
          setPendingPKP(agentPKP);
        } catch (error) {
          setLocalError(error instanceof Error ? error.message : 'Failed to mint PKP');
          setIsConnectProcessing(false);
          Sentry.captureException(error, {
            extra: {
              context: 'ConnectPage.mintPKPToExistingPKP',
              userPKPTokenId: readAuthInfo.authInfo.userPKP.tokenId,
            },
          });
          return;
        }
      }

      if (!agentPKP) {
        setLocalError('Failed to initialize PKP');
        setIsConnectProcessing(false);
        return;
      }

      setAgentPKP(agentPKP);

      const client = getClient({ signer: userPkpWallet });

      // Step 2: Add permitted actions (idempotent - adding them again is safe)
      try {
        await addPermittedActions({
          wallet: userPkpWallet,
          agentPKPTokenId: agentPKP.tokenId,
          abilityIpfsCids: Object.keys(selectedFormData),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Check if this is a rate limit related error that addPayee might fix
        const isRateLimitError = errorMessage.toLowerCase().includes('rate limit exceeded');
        const isInsufficientFunds = errorMessage.toLowerCase().includes('insufficient funds');

        if (isRateLimitError) {
          console.warn(
            'addPermittedActions failed with rate limit error, attempting addPayee retry',
            error,
          );
          try {
            await addPayee(readAuthInfo.authInfo.userPKP.ethAddress);
            console.log('Successfully added payee, retrying addPermittedActions');

            // Retry addPermittedActions
            await addPermittedActions({
              wallet: userPkpWallet,
              agentPKPTokenId: agentPKP.tokenId,
              abilityIpfsCids: Object.keys(selectedFormData),
            });
          } catch (retryError) {
            setLocalError(
              retryError instanceof Error
                ? `Failed after addPayee attempt: ${retryError.message}`
                : 'Failed after addPayee attempt',
            );
            setIsConnectProcessing(false);
            Sentry.captureException(retryError, {
              extra: {
                context: 'ConnectPage.addPermittedActions.retryAfterAddPayee',
                agentPKPTokenId: agentPKP.tokenId,
              },
            });
            return;
          }
        } else if (isInsufficientFunds) {
          // Insufficient funds - show helpful message with faucet link (don't log to Sentry - expected)
          const customMessage = `Insufficient testnet funds. Authentication Address (testnet only): ${readAuthInfo.authInfo.userPKP.ethAddress}. Please fund it with the faucet here:`;
          setLocalError(customMessage);
          setIsConnectProcessing(false);
          return;
        } else {
          // Other error - log to Sentry and fail
          Sentry.captureException(error, {
            extra: {
              context: 'ConnectPage.addPermittedActions',
              agentPKPTokenId: agentPKP.tokenId,
            },
          });
          setLocalError(error instanceof Error ? error.message : 'Failed to add permitted actions');
          setIsConnectProcessing(false);
          return;
        }
      }

      // Step 3: Permit app
      try {
        await client.permitApp({
          pkpEthAddress: agentPKP.ethAddress,
          appId: Number(connectInfoMap.app.appId),
          appVersion: Number(connectInfoMap.app.activeVersion),
          permissionData: selectedFormData,
        });

        // Clear the pending PKP on success
        clearPendingPKP();

        setIsConnectProcessing(false);
        setLocalSuccess('Permissions granted successfully!');
        console.log('agentPKP:', agentPKP);
      } catch (error) {
        Sentry.captureException(error, {
          extra: {
            context: 'ConnectPage.permitApp',
            agentPKPAddress: agentPKP.ethAddress,
            appId: connectInfoMap.app.appId,
            appVersion: connectInfoMap.app.activeVersion,
          },
        });
        setLocalError(error instanceof Error ? error.message : 'Failed to permit app');
        setIsConnectProcessing(false);
        return;
      }
    } else {
      setLocalError('Some of your permissions are not valid. Please check the form and try again.');
      setIsConnectProcessing(false);
    }
  }, [getSelectedFormData, readAuthInfo, addPermittedActions, generateJWT, connectInfoMap.app]);

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
  const error = localError || jwtError || actionsError;

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
          selectedPolicies={selectedPolicies}
          onPolicySelectionChange={handlePolicySelectionChange}
        />

        {/* Status Card */}
        <StatusCard
          isLoading={isLoading}
          loadingStatus={loadingStatus}
          error={error || localError}
          success={localSuccess}
          includeLinks={
            localError?.includes('Insufficient')
              ? 'https://chronicle-yellowstone-faucet.getlit.dev/'
              : undefined
          }
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
