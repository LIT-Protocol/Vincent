import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { IRelayPKP } from '@lit-protocol/types';
import { getClient, PermissionData } from '@lit-protocol/vincent-contracts-sdk';

import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';
import { PolicyFormRef } from '../connect/ui/PolicyForm';
import { StatusCard } from '../connect/ui/StatusCard';
import { AppPermissionDashboardHeader } from './ui/AppPermissionDashboardHeader';
import { PermittedAppInfo } from './ui/PermittedAppInfo';
import { UserPermissionButtons } from './ui/UserPermissionButtons';
import { useAddPermittedActions } from '@/hooks/user-dashboard/connect/useAddPermittedActions';
import { ConnectInfoMap } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { useJwtRedirect } from '@/hooks/user-dashboard/connect/useJwtRedirect';
import { useUrlRedirectUri } from '@/hooks/user-dashboard/connect/useUrlRedirectUri';
import { useFormatUserPermissions } from '@/hooks/user-dashboard/dashboard/useFormatUserPermissions';
import { ReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { AppVersion } from '@/types/developer-dashboard/appTypes';
import { hasConfigurablePolicies } from '@/utils/user-dashboard/hasConfigurablePolicies';
import { litNodeClient } from '@/utils/user-dashboard/lit';

interface AppPermissionPageProps {
  connectInfoMap: ConnectInfoMap;
  readAuthInfo: ReadAuthInfo;
  agentPKP: IRelayPKP;
  existingData: PermissionData;
  permittedAppVersions: Record<string, string>;
  appVersionsMap: Record<string, AppVersion[]>;
  onBackToConsent?: () => void;
}

export function AppPermissionPage({
  connectInfoMap,
  readAuthInfo,
  agentPKP,
  existingData,
  permittedAppVersions,
  appVersionsMap,
  onBackToConsent,
}: AppPermissionPageProps) {
  const navigate = useNavigate();
  const appIdString = connectInfoMap.app.appId.toString();
  const permittedVersion = permittedAppVersions[appIdString];

  // Check if there are any configurable policies
  const hasPolicies = hasConfigurablePolicies(connectInfoMap, permittedVersion, appIdString);
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
      executeRedirect();
    }
  }, [redirectUrl, localSuccess, executeRedirect]);

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
        setLocalSuccess(null);
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
        // Show success state then handle redirect or clear success
        setLocalSuccess('Permissions granted successfully!');

        // Generate JWT for redirect (useJwtRedirect will handle if there's a redirectUri)
        setLocalSuccess(null);
        // Only generate JWT if there's a redirectUri (for app redirects)
        if (redirectUri) {
          await generateJWT(connectInfoMap.app, Number(permittedVersion));
        }
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
      // Navigate to apps page
      navigate('/user/apps');
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
    <div className="w-full max-w-4xl mx-auto relative z-10 space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Dashboard Header with Stats */}
      <AppPermissionDashboardHeader
        app={connectInfoMap.app}
        permittedVersion={permittedVersion}
        appVersionsMap={appVersionsMap}
      />

      {/* Main Card - Contains everything */}
      <div
        className={`backdrop-blur-xl ${theme.mainCard} border ${theme.mainCardBorder} rounded-lg p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 lg:space-y-6`}
      >
        {/* Permissions Section */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className={`text-base sm:text-lg font-semibold ${theme.text}`} style={fonts.heading}>
            App Permissions
          </h2>
          <div className="space-y-2 sm:space-y-3">
            <PermittedAppInfo
              connectInfoMap={connectInfoMap}
              formData={formData}
              onFormChange={handleFormChange}
              onRegisterFormRef={registerFormRef}
              selectedPolicies={selectedPolicies}
              onPolicySelectionChange={handlePolicySelectionChange}
              permittedVersion={permittedVersion}
            />
          </div>
        </div>

        {/* Divider */}
        <div className={`border-t ${theme.cardBorder}`} />

        {/* Status Card - Above Action Buttons */}
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
          onBackToConsent={onBackToConsent}
          isLoading={isLoading}
          isGranting={isGranting}
          isUnpermitting={isUnpermitting}
          error={error || localError}
          hasConfigurablePolicies={hasPolicies}
        />
      </div>

      {/* Coming Soon - Wallet Activity Preview */}
      <div
        className={`backdrop-blur-xl ${theme.mainCard} border ${theme.cardBorder} rounded-lg p-4 sm:p-5 lg:p-6 relative mb-20 sm:mb-6`}
      >
        {/* Coming Soon badge - upper right corner */}
        <span
          className={`absolute top-4 sm:top-5 lg:top-6 right-4 sm:right-5 lg:right-6 text-xs sm:text-sm font-semibold px-2 py-1 rounded bg-orange-50 border border-orange-300 dark:bg-orange-500/10 dark:border-orange-500/30`}
          style={{ color: theme.brandOrange, ...fonts.heading }}
        >
          Coming Soon
        </span>

        <div className="mb-4 opacity-50">
          <h2 className={`text-base sm:text-lg font-semibold ${theme.text}`} style={fonts.heading}>
            Wallet Activity
          </h2>
        </div>

        {/* Simplified line chart visual */}
        <div className="relative h-32 sm:h-40 lg:h-48 opacity-50">
          <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
            {/* Grid lines */}
            <line
              x1="0"
              y1="25"
              x2="400"
              y2="25"
              stroke="currentColor"
              strokeWidth="0.5"
              className={theme.textMuted}
              opacity="0.2"
            />
            <line
              x1="0"
              y1="50"
              x2="400"
              y2="50"
              stroke="currentColor"
              strokeWidth="0.5"
              className={theme.textMuted}
              opacity="0.2"
            />
            <line
              x1="0"
              y1="75"
              x2="400"
              y2="75"
              stroke="currentColor"
              strokeWidth="0.5"
              className={theme.textMuted}
              opacity="0.2"
            />

            {/* Line graph */}
            <polyline
              points="0,80 50,65 100,70 150,45 200,50 250,30 300,35 350,20 400,25"
              fill="none"
              stroke={theme.brandOrange}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Area under line */}
            <polygon
              points="0,80 50,65 100,70 150,45 200,50 250,30 300,35 350,20 400,25 400,100 0,100"
              fill={theme.brandOrange}
              opacity="0.1"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
