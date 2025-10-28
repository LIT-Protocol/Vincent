import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import * as Sentry from '@sentry/react';
import { IRelayPKP } from '@lit-protocol/types';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';

import { Button } from '@/components/shared/ui/button';
import { AppsInfo } from '@/components/user-dashboard/connect/ui/AppInfo';
import { ConnectAppHeader } from '@/components/user-dashboard/connect/ui/ConnectAppHeader';
import { ConnectPageHeader } from '@/components/user-dashboard/connect/ui/ConnectPageHeader';
import { InfoBanner } from '@/components/user-dashboard/connect/ui/InfoBanner';
import { PolicyFormRef } from '@/components/user-dashboard/connect/ui/PolicyForm';
import { StatusCard } from '@/components/user-dashboard/connect/ui/StatusCard';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';
import { useAddPermittedActions } from '@/hooks/user-dashboard/connect/useAddPermittedActions';
import { ConnectInfoMap } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { useConnectFormData } from '@/hooks/user-dashboard/connect/useConnectFormData';
import { useJwtRedirect } from '@/hooks/user-dashboard/connect/useJwtRedirect';
import { ReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { litNodeClient } from '@/utils/user-dashboard/lit';

interface UpdateVersionCardProps {
  connectInfoMap: ConnectInfoMap;
  readAuthInfo: ReadAuthInfo;
  agentPKP: IRelayPKP;
  currentVersion: number;
  redirectUri: string;
  onBackToConsent: () => void;
}

export function UpdateVersionCard({
  connectInfoMap,
  readAuthInfo,
  agentPKP,
  currentVersion,
  redirectUri,
  onBackToConsent,
}: UpdateVersionCardProps) {
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
        await generateJWT(connectInfoMap.app, connectInfoMap.app.activeVersion!);
      } catch (error) {
        setLocalError(error instanceof Error ? error.message : 'Failed to update version');
        setLocalStatus(null);
        Sentry.captureException(error, {
          extra: {
            context: 'UpdateVersionCard.handleSubmit',
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
  }, [
    formData,
    readAuthInfo,
    addPermittedActions,
    connectInfoMap.app,
    generateJWT,
    redirectUri,
    onBackToConsent,
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

        {/* Version update info banner */}
        <InfoBanner
          title="Version Update Available"
          message={`You're using version ${currentVersion}, but the app has updated to version ${connectInfoMap.app.activeVersion}. Please review the permissions below carefully before updating.`}
        />

        {/* Permissions Form */}
        <div className="space-y-3">
          <AppsInfo
            connectInfoMap={connectInfoMap}
            formData={formData}
            onFormChange={handleFormChange}
            onRegisterFormRef={registerFormRef}
            selectedPolicies={selectedPolicies}
            onPolicySelectionChange={handlePolicySelectionChange}
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
                {error || localError ? 'Retry' : isGranting ? 'Processing...' : 'Update Version'}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
