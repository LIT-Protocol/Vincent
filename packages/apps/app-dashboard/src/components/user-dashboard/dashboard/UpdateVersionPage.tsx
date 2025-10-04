import { useState, useCallback, useRef } from 'react';
import * as Sentry from '@sentry/react';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { IRelayPKP } from '@lit-protocol/types';
import { ConnectInfoMap } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { useConnectFormData } from '@/hooks/user-dashboard/connect/useConnectFormData';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { PolicyFormRef } from '@/components/user-dashboard/connect/ui/PolicyForm';
import { ReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { useAddPermittedActions } from '@/hooks/user-dashboard/connect/useAddPermittedActions';
import { ConnectAppHeader } from '@/components/user-dashboard/connect/ui/ConnectAppHeader';
import { AppsInfo } from '@/components/user-dashboard/connect/ui/AppInfo';
import { ActionButtons } from '@/components/user-dashboard/connect/ui/ActionButtons';
import { StatusCard } from '@/components/user-dashboard/connect/ui/StatusCard';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { litNodeClient } from '@/utils/user-dashboard/lit';
import { PageHeader } from './ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useJwtRedirect } from '@/hooks/user-dashboard/connect/useJwtRedirect';
import { useUrlRedirectUri } from '@/hooks/user-dashboard/connect/useUrlRedirectUri';
import { useEffect } from 'react';

interface UpdateVersionPageProps {
  connectInfoMap: ConnectInfoMap;
  readAuthInfo: ReadAuthInfo;
  agentPKP: IRelayPKP;
}

export function UpdateVersionPage({
  connectInfoMap,
  readAuthInfo,
  agentPKP,
}: UpdateVersionPageProps) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const formRefs = useRef<Record<string, PolicyFormRef>>({});
  const navigate = useNavigate();

  // Check if there's a redirectUri in URL for redirect logic
  const { redirectUri } = useUrlRedirectUri();

  // JWT redirect logic for when there's a redirectUri
  const {
    generateJWT,
    executeRedirect,
    isLoading: isJwtLoading,
    loadingStatus: jwtLoadingStatus,
    error: jwtError,
    redirectUrl,
  } = useJwtRedirect({ readAuthInfo, agentPKP });

  // Handle redirect when JWT is ready
  useEffect(() => {
    if (redirectUrl && !localSuccess) {
      setLocalSuccess('Success! Redirecting to app...');
      setTimeout(() => {
        executeRedirect();
      }, 2000);
    }
  }, [redirectUrl, localSuccess, executeRedirect]);

  const {
    formData,
    selectedPolicies,
    handleFormChange,
    handlePolicySelectionChange,
    getSelectedFormData,
  } = useConnectFormData(connectInfoMap);

  const {
    addPermittedActions,
    isLoading: isActionsLoading,
    loadingStatus: actionsLoadingStatus,
    error: actionsError,
  } = useAddPermittedActions();

  const handleSubmit = useCallback(async () => {
    // Clear any previous local errors and success
    setLocalError(null);
    setLocalSuccess(null);

    // Check if all forms are valid using RJSF's built-in validateForm method
    const allValid = Object.values(formRefs.current).every((formRef) => {
      return formRef.validateForm();
    });

    if (allValid) {
      if (!agentPKP || !readAuthInfo.authInfo?.userPKP || !readAuthInfo.sessionSigs) {
        setLocalError('Missing authentication information. Please try refreshing the page.');
        setLocalStatus(null);
        return;
      }

      setLocalStatus('Initializing account...');
      const userPkpWallet = new PKPEthersWallet({
        controllerSessionSigs: readAuthInfo.sessionSigs,
        pkpPubKey: readAuthInfo.authInfo.userPKP.publicKey,
        litNodeClient: litNodeClient,
      });
      await userPkpWallet.init();

      const selectedFormData = getSelectedFormData();

      setLocalStatus('Adding permitted actions...');
      await addPermittedActions({
        wallet: userPkpWallet,
        agentPKPTokenId: agentPKP.tokenId,
        abilityIpfsCids: Object.keys(selectedFormData),
      });

      try {
        setLocalStatus('Updating to new version...');
        const client = getClient({ signer: userPkpWallet });
        await client.permitApp({
          pkpEthAddress: agentPKP.ethAddress,
          appId: Number(connectInfoMap.app.appId),
          appVersion: Number(connectInfoMap.app.activeVersion),
          permissionData: selectedFormData,
        });

        setLocalStatus(null);
        // Show success state for 3 seconds, then redirect or reload
        setLocalSuccess('Version updated successfully!');
        setTimeout(async () => {
          setLocalSuccess(null);
          // Only generate JWT if there's a redirectUri (for app redirects)
          if (redirectUri) {
            await generateJWT(connectInfoMap.app, connectInfoMap.app.activeVersion!);
          } else {
            // Navigate to the app permissions page with full refresh to update sidebar
            window.location.href = `/user/appId/${connectInfoMap.app.appId}`;
          }
        }, 3000);
      } catch (error) {
        setLocalError(error instanceof Error ? error.message : 'Failed to update version');
        setLocalStatus(null);
        Sentry.captureException(error, {
          extra: {
            context: 'UpdateVersionPage.handleAccept',
            appId: connectInfoMap.app.appId,
            newVersion: connectInfoMap.app.activeVersion,
          },
        });
        return;
      }
    } else {
      setLocalError('Some of your permissions are not valid. Please check the form and try again.');
      setLocalStatus(null);
    }
  }, [formData, readAuthInfo, addPermittedActions, connectInfoMap.app, generateJWT]);

  const handleDecline = useCallback(() => {
    navigate(`/user/appId/${connectInfoMap.app.appId}`);
  }, [connectInfoMap.app.appId, navigate]);

  const registerFormRef = useCallback((policyIpfsCid: string, ref: PolicyFormRef) => {
    formRefs.current[policyIpfsCid] = ref;
  }, []);

  const isLoading = isJwtLoading || isActionsLoading || !!localStatus || !!localSuccess;
  const loadingStatus = jwtLoadingStatus || actionsLoadingStatus || localStatus;
  const error = jwtError || actionsError;

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
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
            />
          </svg>
        }
        title="Update App Version"
        description="Review and update permissions for the latest version"
      />

      <div className="px-3 sm:px-4 py-6 sm:py-8 space-y-6">
        {/* App Header */}
        <ConnectAppHeader app={connectInfoMap.app} />

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
    </div>
  );
}
