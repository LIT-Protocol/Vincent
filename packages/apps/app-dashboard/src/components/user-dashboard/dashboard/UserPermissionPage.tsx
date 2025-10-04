import { useState, useCallback, useRef, useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { getClient, PermissionData } from '@lit-protocol/vincent-contracts-sdk';
import { IRelayPKP } from '@lit-protocol/types';
import { ConnectInfoMap } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { useFormatUserPermissions } from '@/hooks/user-dashboard/dashboard/useFormatUserPermissions';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { PolicyFormRef } from '../connect/ui/PolicyForm';
import { ReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
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

interface AppPermissionPageProps {
  connectInfoMap: ConnectInfoMap;
  readAuthInfo: ReadAuthInfo;
  agentPKP: IRelayPKP;
  existingData: PermissionData;
  permittedAppVersions: Record<string, string>;
}

export function AppPermissionPage({
  connectInfoMap,
  readAuthInfo,
  agentPKP,
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

  const appIdString = connectInfoMap.app.appId.toString();
  const permittedVersion = permittedAppVersions[appIdString];

  const { formData, handleFormChange, selectedPolicies, handlePolicySelectionChange } =
    useFormatUserPermissions(connectInfoMap, existingData, Number(permittedVersion));

  const {
    addPermittedActions,
    isLoading: isActionsLoading,
    loadingStatus: actionsLoadingStatus,
    error: actionsError,
  } = useAddPermittedActions();

  const handleSubmit = useCallback(async () => {
    console.log('[UserPermissionPage] Starting submission', {
      formData,
      selectedPolicies,
      existingData,
    });

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

      const policyParams: Record<string, any> = {};
      const deletePermissionData: Record<string, string[]> = {};

      // Track which policies exist in the current permission data per ability
      const existingPoliciesByAbility: Record<string, string[]> = {};
      if (existingData) {
        Object.keys(existingData).forEach((abilityIpfsCid) => {
          const abilityData = existingData[abilityIpfsCid];
          if (abilityData && typeof abilityData === 'object') {
            existingPoliciesByAbility[abilityIpfsCid] = Object.keys(abilityData);
          }
        });
      }

      // Build policy parameters and deletion list
      Object.keys(formData).forEach((abilityIpfsCid) => {
        const abilityData = formData[abilityIpfsCid];
        const filteredAbilityData: Record<string, any> = {};

        // Collect selected policies for updates
        Object.keys(abilityData).forEach((policyIpfsCid) => {
          if (selectedPolicies[policyIpfsCid]) {
            filteredAbilityData[policyIpfsCid] = abilityData[policyIpfsCid] || {};
          }
        });

        const hasUpdates = Object.keys(filteredAbilityData).length > 0;

        if (hasUpdates) {
          // If we are updating this ability, do NOT include deletions for the same ability (avoids overlap)
          policyParams[abilityIpfsCid] = filteredAbilityData;
        } else {
          // No updates for this ability; if there were previously enabled policies, delete them
          const previouslyEnabled = existingPoliciesByAbility[abilityIpfsCid] || [];
          if (previouslyEnabled.length > 0) {
            // Delete all previously enabled policies that are not selected
            const toDelete = previouslyEnabled.filter((cid) => !selectedPolicies[cid]);
            if (toDelete.length > 0) {
              deletePermissionData[abilityIpfsCid] = toDelete;
            }
          }
        }
      });

      const currentStateJson = JSON.stringify({ formData, selectedPolicies });
      const initialStateJson = JSON.stringify({
        formData: existingData || {},
        selectedPolicies: Object.fromEntries(
          Object.keys(selectedPolicies).map((policyId) => [
            policyId,
            // A policy was initially selected if it exists in existingData
            Object.keys(existingData || {}).some(
              (abilityId) => existingData?.[abilityId]?.[policyId] !== undefined,
            ),
          ]),
        ),
      });

      const hasAnyChanges = currentStateJson !== initialStateJson;

      if (!hasAnyChanges) {
        setLocalStatus(null);
        setLocalSuccess('Permissions are up to date.');
        setTimeout(() => {
          setLocalSuccess(null);
        }, 3000);
        return;
      }

      // We should do this in case there was ever an error doing this previously
      setLocalStatus('Adding permitted actions...');
      // Get all ability CIDs from existing data, new parameters, and deletion-only abilities
      const allAbilityIpfsCids = [
        ...Object.keys(existingData || {}),
        ...Object.keys(policyParams),
        ...Object.keys(deletePermissionData),
      ];

      await addPermittedActions({
        wallet: userPkpWallet,
        agentPKPTokenId: agentPKP.tokenId,
        abilityIpfsCids: allAbilityIpfsCids,
      });

      try {
        setLocalStatus('Setting ability policy parameters...');
        const client = getClient({ signer: userPkpWallet });
        const result = await client.setAbilityPolicyParameters({
          pkpEthAddress: agentPKP.ethAddress,
          appId: Number(connectInfoMap.app.appId),
          appVersion: Number(permittedVersion),
          policyParams,
          deletePermissionData: deletePermissionData,
        });

        console.log('[UserPermissionPage] setAbilityPolicyParameters result:', result);

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
        Sentry.captureException(error, {
          extra: {
            context: 'UserPermissionPage.handleSubmit',
            appId: connectInfoMap.app.appId,
            permittedVersion,
          },
        });
        return;
      }
    } else {
      setLocalError('Some of your permissions are not valid. Please check the form and try again.');
      setLocalStatus(null);
    }
  }, [
    formData,
    selectedPolicies,
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
        pkpEthAddress: agentPKP.ethAddress,
        appId: Number(connectInfoMap.app.appId),
        appVersion: Number(permittedVersion),
      });

      setLocalStatus(null);
      // Show success state until redirect
      setLocalSuccess('App unpermitted successfully!');
      setTimeout(() => {
        // Force the refresh for the sidebar to update
        window.location.href = `/user/apps`;
      }, 3000);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Failed to unpermit app');
      setLocalStatus(null);
      Sentry.captureException(error, {
        extra: {
          context: 'UserPermissionPage.handleUnpermit',
          appId: connectInfoMap.app.appId,
          permittedVersion,
        },
      });
    }
  }, [readAuthInfo, connectInfoMap.app, permittedVersion]);

  const registerFormRef = useCallback((policyIpfsCid: string, ref: PolicyFormRef) => {
    formRefs.current[policyIpfsCid] = ref;
  }, []);

  const isUnpermitting = localStatus === 'Unpermitting app...';
  const isGranting = isJwtLoading || isActionsLoading || (!!localStatus && !isUnpermitting);
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
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        }
        title="Manage App Permissions"
        description="Review and modify your permissions for this app"
        linkUrl={connectInfoMap.app.appUserUrl}
        linkText="Open App"
      />

      <div className="px-3 sm:px-4 py-6 sm:py-8 space-y-6">
        {/* App Header */}
        <ConnectAppHeader app={connectInfoMap.app} />

        {/* Apps and Versions */}
        <PermittedAppInfo
          connectInfoMap={connectInfoMap}
          formData={formData}
          onFormChange={handleFormChange}
          onRegisterFormRef={registerFormRef}
          selectedPolicies={selectedPolicies}
          onPolicySelectionChange={handlePolicySelectionChange}
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
          isGranting={isGranting}
          isUnpermitting={isUnpermitting}
          error={error || localError}
        />
      </div>
    </div>
  );
}
