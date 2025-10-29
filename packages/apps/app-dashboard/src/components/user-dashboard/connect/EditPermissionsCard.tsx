import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import * as Sentry from '@sentry/react';
import { IRelayPKP } from '@lit-protocol/types';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { getClient, PermissionData } from '@lit-protocol/vincent-contracts-sdk';

import { Button } from '@/components/shared/ui/button';
import { ConnectAppHeader } from './ui/ConnectAppHeader';
import { ConnectPageHeader } from './ui/ConnectPageHeader';
import { PolicyFormRef } from './ui/PolicyForm';
import { StatusCard } from './ui/StatusCard';
import { theme, fonts } from './ui/theme';
import { PermittedAppInfo } from '../dashboard/ui/PermittedAppInfo';
import { useAddPermittedActions } from '@/hooks/user-dashboard/connect/useAddPermittedActions';
import { ConnectInfoMap } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { useJwtRedirect } from '@/hooks/user-dashboard/connect/useJwtRedirect';
import { useFormatUserPermissions } from '@/hooks/user-dashboard/dashboard/useFormatUserPermissions';
import { ReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { litNodeClient } from '@/utils/user-dashboard/lit';

interface EditPermissionsCardProps {
  connectInfoMap: ConnectInfoMap;
  readAuthInfo: ReadAuthInfo;
  agentPKP: IRelayPKP;
  existingData: PermissionData;
  permittedVersion: number;
  redirectUri: string;
  onBackToConsent: () => void;
}

export function EditPermissionsCard({
  connectInfoMap,
  readAuthInfo,
  agentPKP,
  existingData,
  permittedVersion,
  redirectUri,
  onBackToConsent,
}: EditPermissionsCardProps) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const formRefs = useRef<Record<string, PolicyFormRef>>({});

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
    useFormatUserPermissions(connectInfoMap, existingData, permittedVersion);

  const {
    addPermittedActions,
    isLoading: isActionsLoading,
    loadingStatus: actionsLoadingStatus,
    error: actionsError,
  } = useAddPermittedActions();

  const handleSubmit = useCallback(async () => {
    console.log('[EditPermissionsCard] Starting submission', {
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
        // No changes to permissions, generate JWT and redirect
        setLocalStatus(null);
        await generateJWT(connectInfoMap.app, Number(permittedVersion));
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

        console.log('[EditPermissionsCard] setAbilityPolicyParameters result:', result);

        setLocalStatus(null);
        await generateJWT(connectInfoMap.app, Number(permittedVersion));
      } catch (error) {
        setLocalError(error instanceof Error ? error.message : 'Failed to update permissions');
        setLocalStatus(null);
        Sentry.captureException(error, {
          extra: {
            context: 'EditPermissionsCard.handleSubmit',
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
    redirectUri,
    onBackToConsent,
    existingData,
    agentPKP,
  ]);

  const registerFormRef = useCallback((policyIpfsCid: string, ref: PolicyFormRef) => {
    formRefs.current[policyIpfsCid] = ref;
  }, []);

  const isGranting = isJwtLoading || isActionsLoading || !!localStatus;
  const isLoading = isJwtLoading || isActionsLoading || !!localStatus || !!localSuccess;
  const loadingStatus = jwtLoadingStatus || actionsLoadingStatus || localStatus;
  const error = jwtError || actionsError;

  return (
    <div
      className={`w-full max-w-md mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden relative z-10 origin-center`}
    >
      {/* Header */}
      <ConnectPageHeader authInfo={readAuthInfo.authInfo!} />

      {/* Main Content */}
      <div className="px-3 sm:px-4 py-6 sm:py-8 space-y-6">
        {/* App Header */}
        {connectInfoMap.app && <ConnectAppHeader app={connectInfoMap.app} />}

        {/* Dividing line */}
        <div className={`border-b ${theme.cardBorder}`}></div>

        {/* Permissions Form */}
        <div className="space-y-3">
          <PermittedAppInfo
            connectInfoMap={connectInfoMap}
            formData={formData}
            onFormChange={handleFormChange}
            onRegisterFormRef={registerFormRef}
            selectedPolicies={selectedPolicies}
            onPolicySelectionChange={handlePolicySelectionChange}
            permittedVersion={permittedVersion.toString()}
          />
        </div>

        {/* Status Card */}
        <StatusCard
          isLoading={isLoading}
          loadingStatus={loadingStatus}
          error={error || localError}
          success={localSuccess}
        />

        {/* Action Buttons */}
        <div className="space-y-4">
          {/* Trust Warning */}
          <div className="flex justify-center text-center">
            <p className={`text-sm ${theme.textSubtle} leading-relaxed`} style={fonts.body}>
              Make sure you trust{' '}
              <span className={`font-medium ${theme.text}`}>{connectInfoMap.app.name}</span>.
              <br />
              By connecting, you may be sharing sensitive account permissions.
            </p>
          </div>

          {/* Action buttons - side by side */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
            {/* Back to Sign In button */}
            <Button
              variant="outline"
              onClick={onBackToConsent}
              className={`px-4 py-2 ${theme.text} border ${theme.cardBorder} hover:bg-orange-500/10 flex items-center gap-2`}
              disabled={isLoading}
              style={fonts.heading}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </Button>

            {/* Update button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto"
            >
              <Button
                onClick={handleSubmit}
                className={`w-full sm:w-auto px-6 py-2 ${error || localError ? 'bg-red-500/20 border-red-500/30 text-red-400' : `${theme.accentBg} ${theme.accentHover}`} border-0 flex items-center justify-center gap-2`}
                disabled={isLoading}
                style={fonts.heading}
              >
                {isGranting && <Loader2 className="w-4 h-4 animate-spin" />}
                {(error || localError) && <AlertCircle className="w-4 h-4" />}
                {error || localError
                  ? 'Retry'
                  : isGranting
                    ? 'Processing...'
                    : 'Update Permissions'}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
