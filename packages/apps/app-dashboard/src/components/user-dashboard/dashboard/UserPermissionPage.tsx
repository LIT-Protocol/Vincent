import { useState, useCallback, useRef } from 'react';
import { getClient, PermissionData } from '@lit-protocol/vincent-contracts-sdk';
import { ConnectInfoMap } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { useFormatUserPermissions } from '@/hooks/user-dashboard/dashboard/useFormatUserPermissions';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { PolicyFormRef } from '../connect/ui/PolicyForm';
import { UseReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { useAddPermittedActions } from '@/hooks/user-dashboard/connect/useAddPermittedActions';
import { ConnectAppHeader } from '../connect/ui/ConnectAppHeader';
import { PermittedAppInfo } from './ui/PermittedAppInfo';
import { UserPermissionButtons } from './ui/UserPermissionButtons';
import { StatusCard } from '../connect/ui/StatusCard';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { litNodeClient } from '@/utils/user-dashboard/lit';
import { PageHeader } from './ui/PageHeader';
import { useJwtRedirect } from '@/hooks/user-dashboard/connect/useJwtRedirect';
import { useUrlRedirectUri } from '@/hooks/user-dashboard/connect/useUrlRedirectUri';
import { useEffect } from 'react';

interface AppPermissionPageProps {
  connectInfoMap: ConnectInfoMap;
  readAuthInfo: UseReadAuthInfo;
  existingData: PermissionData;
  permittedAppVersions: Record<string, string>;
}

export function AppPermissionPage({
  connectInfoMap,
  readAuthInfo,
  existingData,
  permittedAppVersions,
}: AppPermissionPageProps) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const formRefs = useRef<Record<string, PolicyFormRef>>({});

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
  } = useJwtRedirect({ readAuthInfo });

  // Handle redirect when JWT is ready
  useEffect(() => {
    if (redirectUrl && !localSuccess) {
      setLocalSuccess('Success! Redirecting to app...');
      setTimeout(() => {
        executeRedirect();
      }, 2000);
    }
  }, [redirectUrl, localSuccess, executeRedirect]);

  const { formData, handleFormChange } = useFormatUserPermissions(connectInfoMap, existingData);

  const {
    addPermittedActions,
    isLoading: isActionsLoading,
    loadingStatus: actionsLoadingStatus,
    error: actionsError,
  } = useAddPermittedActions();

  // Get the permitted version for this app
  const appIdString = connectInfoMap.app.appId.toString();
  const permittedVersion = permittedAppVersions[appIdString];

  const handleSubmit = useCallback(async () => {
    // Clear any previous local errors and success
    setLocalError(null);
    setLocalSuccess(null);

    // Check if all forms are valid using RJSF's built-in validateForm method
    const allValid = Object.values(formRefs.current).every((formRef) => {
      return formRef.validateForm();
    });

    if (allValid) {
      if (!readAuthInfo.authInfo?.userPKP || !readAuthInfo.sessionSigs) {
        setLocalError('Missing authentication information. Please try refreshing the page.');
        setLocalStatus(null);
        return;
      }

      setLocalStatus('Initializing account...');
      const agentPkpWallet = new PKPEthersWallet({
        controllerSessionSigs: readAuthInfo.sessionSigs,
        pkpPubKey: readAuthInfo.authInfo.userPKP.publicKey,
        litNodeClient: litNodeClient,
      });
      await agentPkpWallet.init();

      // We should do this in case there was ever an error doing this previously
      setLocalStatus('Adding permitted actions...');
      await addPermittedActions({
        wallet: agentPkpWallet,
        agentPKPTokenId: readAuthInfo.authInfo.userPKP.tokenId,
        abilityIpfsCids: Object.keys(formData),
      });

      try {
        setLocalStatus('Setting ability policy parameters...');
        const client = getClient({ signer: agentPkpWallet });
        await client.setAbilityPolicyParameters({
          pkpEthAddress: readAuthInfo.authInfo.agentPKP!.ethAddress,
          appId: Number(connectInfoMap.app.appId),
          appVersion: Number(permittedVersion),
          policyParams: formData,
        });

        setLocalStatus(null);
        // Show success state for 3 seconds, then handle redirect or clear success
        setLocalSuccess('Permissions granted successfully!');

        // Generate JWT for redirect (useJwtRedirect will handle if there's a redirectUri)
        setTimeout(async () => {
          setLocalSuccess(null);
          // Only generate JWT if there's a redirectUri (for app redirects)
          if (redirectUri) {
            await generateJWT(connectInfoMap.app, Number(permittedVersion));
          }
        }, 3000);
      } catch (error) {
        setLocalError(error instanceof Error ? error.message : 'Failed to permit app');
        setLocalStatus(null);
        return;
      }
    } else {
      setLocalStatus(null);
    }
  }, [
    formData,
    readAuthInfo,
    addPermittedActions,
    connectInfoMap.app,
    permittedVersion,
    generateJWT,
  ]);

  const handleUnpermit = useCallback(async () => {
    // Clear any previous local errors and success
    setLocalError(null);
    setLocalSuccess(null);

    if (!readAuthInfo.authInfo?.userPKP || !readAuthInfo.sessionSigs) {
      setLocalError('Missing authentication information. Please try refreshing the page.');
      setLocalStatus(null);
      return;
    }

    try {
      const agentPkpWallet = new PKPEthersWallet({
        controllerSessionSigs: readAuthInfo.sessionSigs,
        pkpPubKey: readAuthInfo.authInfo.userPKP.publicKey,
        litNodeClient: litNodeClient,
      });
      await agentPkpWallet.init();

      setLocalStatus('Unpermitting app...');

      const client = getClient({ signer: agentPkpWallet });
      await client.unPermitApp({
        pkpEthAddress: readAuthInfo.authInfo.agentPKP!.ethAddress,
        appId: Number(connectInfoMap.app.appId),
        appVersion: Number(permittedVersion),
      });

      setLocalStatus(null);
      // Show success state for 3 seconds, then navigate to apps page
      setLocalSuccess('App unpermitted successfully!');
      setTimeout(() => {
        setLocalSuccess(null);
        // Force the refresh for the sidebar to update
        window.location.href = `/user/apps`;
      }, 3000);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Failed to unpermit app');
      setLocalStatus(null);
    }
  }, [readAuthInfo, connectInfoMap.app, permittedVersion]);

  const registerFormRef = useCallback((policyIpfsCid: string, ref: PolicyFormRef) => {
    formRefs.current[policyIpfsCid] = ref;
  }, []);

  const isLoading = isJwtLoading || isActionsLoading || !!localStatus || !!localSuccess;
  const loadingStatus = jwtLoadingStatus || actionsLoadingStatus || localStatus;
  const error = jwtError || actionsError;

  return (
    <div className={`w-full transition-colors duration-500 ${theme.bg} sm:p-4`}>
      {/* Main Card Container */}
      <div
        className={`max-w-6xl mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl`}
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
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          }
          title="Manage App Permissions"
          description="Review and modify your permissions for this app"
        />

        <div className="px-3 sm:px-6 py-6 sm:py-8 space-y-6">
          {/* App Header */}
          <ConnectAppHeader app={connectInfoMap.app} />

          {/* Apps and Versions */}
          <PermittedAppInfo
            connectInfoMap={connectInfoMap}
            formData={formData}
            onFormChange={handleFormChange}
            onRegisterFormRef={registerFormRef}
            permittedVersion={permittedVersion}
          />

          {/* Status Card */}
          <StatusCard
            isLoading={isLoading}
            loadingStatus={loadingStatus}
            error={error || localError}
            success={localSuccess}
          />

          {/* Action Buttons */}
          <UserPermissionButtons
            onUnpermit={handleUnpermit}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error || localError}
          />
        </div>
      </div>
    </div>
  );
}
