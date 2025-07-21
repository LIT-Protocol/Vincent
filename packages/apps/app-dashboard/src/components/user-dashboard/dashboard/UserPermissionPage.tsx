import { useState, useCallback, useRef } from 'react';
import {
  setToolPolicyParameters,
  PermissionData,
  unPermitApp,
} from '@lit-protocol/vincent-contracts-sdk';
import { ConsentInfoMap } from '@/hooks/user-dashboard/consent/useConsentInfo';
import { useFormatUserPermissions } from '@/hooks/user-dashboard/dashboard/useFormatUserPermissions';
import { theme } from '../consent/ui/theme';
import { PolicyFormRef } from '../consent/ui/PolicyForm';
import { UseReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { useAddPermittedActions } from '@/hooks/user-dashboard/consent/useAddPermittedActions';
import { ConsentAppHeader } from '../consent/ui/ConsentAppHeader';
import { PermittedAppInfo } from './ui/PermittedAppInfo';
import { UserPermissionButtons } from './ui/UserPermissionButtons';
import { StatusCard } from '../consent/ui/StatusCard';
import { useTheme } from '@/providers/ThemeProvider';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { litNodeClient } from '@/utils/user-dashboard/lit';
import { PageHeader } from './ui/PageHeader';
import { useNavigate } from 'react-router-dom';

interface AppPermissionPageProps {
  consentInfoMap: ConsentInfoMap;
  readAuthInfo: UseReadAuthInfo;
  existingData: PermissionData;
  permittedAppVersions: Record<string, string>;
}

export function AppPermissionPage({
  consentInfoMap,
  readAuthInfo,
  existingData,
  permittedAppVersions,
}: AppPermissionPageProps) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const formRefs = useRef<Record<string, PolicyFormRef>>({});
  const { isDark } = useTheme();
  const themeStyles = theme(isDark);
  const navigate = useNavigate();

  const { formData, handleFormChange } = useFormatUserPermissions(consentInfoMap, existingData);

  const {
    addPermittedActions,
    isLoading: isActionsLoading,
    loadingStatus: actionsLoadingStatus,
    error: actionsError,
  } = useAddPermittedActions();

  // Get the permitted version for this app
  const appIdString = consentInfoMap.app.appId.toString();
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
        toolIpfsCids: Object.keys(formData),
      });

      try {
        setLocalStatus('Setting tool policy parameters...');
        await setToolPolicyParameters({
          signer: agentPkpWallet,
          args: {
            pkpEthAddress: readAuthInfo.authInfo.agentPKP!.ethAddress,
            appId: Number(consentInfoMap.app.appId),
            appVersion: Number(permittedVersion),
            policyParams: formData,
          },
        });

        setLocalStatus(null);
        // Show success state for 3 seconds
        setLocalSuccess('Permissions granted successfully!');
        setTimeout(() => {
          setLocalSuccess(null);
        }, 3000);
      } catch (error) {
        setLocalError(error instanceof Error ? error.message : 'Failed to permit app');
        setLocalStatus(null);
        return;
      }
    } else {
      setLocalStatus(null);
    }
  }, [formData, readAuthInfo, addPermittedActions, consentInfoMap.app, permittedVersion]);

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

      await unPermitApp({
        signer: agentPkpWallet,
        args: {
          pkpEthAddress: readAuthInfo.authInfo.agentPKP!.ethAddress,
          appId: Number(consentInfoMap.app.appId),
          appVersion: Number(permittedVersion),
        },
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
  }, [readAuthInfo, consentInfoMap.app, permittedVersion, navigate]);

  const registerFormRef = useCallback((policyIpfsCid: string, ref: PolicyFormRef) => {
    formRefs.current[policyIpfsCid] = ref;
  }, []);

  const isLoading = isActionsLoading || !!localStatus || !!localSuccess;
  const loadingStatus = actionsLoadingStatus || localStatus;
  const error = actionsError;

  return (
    <div className="w-full">
      {/* Main Card Container */}
      <div
        className={`max-w-6xl mx-auto ${themeStyles.mainCard} border ${themeStyles.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden`}
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
          theme={themeStyles}
        />

        <div className="px-6 py-8 space-y-6">
          {/* App Header */}
          <ConsentAppHeader app={consentInfoMap.app} theme={themeStyles} />

          {/* Apps and Versions */}
          <PermittedAppInfo
            consentInfoMap={consentInfoMap}
            theme={themeStyles}
            isDark={isDark}
            formData={formData}
            onFormChange={handleFormChange}
            onRegisterFormRef={registerFormRef}
            permittedVersion={permittedVersion}
          />

          {/* Status Card */}
          <StatusCard
            theme={themeStyles}
            isLoading={isLoading}
            loadingStatus={loadingStatus}
            error={error || localError}
            success={localSuccess}
          />

          {/* Action Buttons */}
          <UserPermissionButtons
            onUnpermit={handleUnpermit}
            onSubmit={handleSubmit}
            theme={themeStyles}
            isLoading={isLoading}
            error={error || localError}
          />
        </div>
      </div>
    </div>
  );
}
