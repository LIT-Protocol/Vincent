import { useState, useCallback, useRef } from 'react';
import { permitApp } from '@lit-protocol/vincent-contracts-sdk';
import { ConsentInfoMap } from '@/hooks/user-dashboard/consent/useConsentInfo';
import { useConsentFormData } from '@/hooks/user-dashboard/consent/useConsentFormData';
import { theme } from '@/components/user-dashboard/consent/ui/theme';
import { PolicyFormRef } from '@/components/user-dashboard/consent/ui/PolicyForm';
import { UseReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { useAddPermittedActions } from '@/hooks/user-dashboard/consent/useAddPermittedActions';
import { ConsentAppHeader } from '@/components/user-dashboard/consent/ui/ConsentAppHeader';
import { AppsInfo } from '@/components/user-dashboard/consent/ui/AppInfo';
import { ActionButtons } from '@/components/user-dashboard/consent/ui/ActionButtons';
import { InfoBanner } from '@/components/user-dashboard/consent/ui/InfoBanner';
import { StatusCard } from '@/components/user-dashboard/consent/ui/StatusCard';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { litNodeClient } from '@/utils/user-dashboard/lit';
import { useTheme } from '@/providers/ThemeProvider';

interface UpdateVersionPageProps {
  consentInfoMap: ConsentInfoMap;
  readAuthInfo: UseReadAuthInfo;
}

export function UpdateVersionPage({ consentInfoMap, readAuthInfo }: UpdateVersionPageProps) {
  const { isDark } = useTheme();
  const [localError, setLocalError] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const formRefs = useRef<Record<string, PolicyFormRef>>({});

  const { formData, handleFormChange } = useConsentFormData(consentInfoMap);

  const {
    addPermittedActions,
    isLoading: isActionsLoading,
    loadingStatus: actionsLoadingStatus,
    error: actionsError,
  } = useAddPermittedActions();

  // Use the theme function
  const themeStyles = theme(isDark);

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

      console.log('formData', formData);

      setLocalStatus('Initializing account...');
      const userPkpWallet = new PKPEthersWallet({
        controllerSessionSigs: readAuthInfo.sessionSigs,
        pkpPubKey: readAuthInfo.authInfo.userPKP.publicKey,
        litNodeClient: litNodeClient,
      });
      await userPkpWallet.init();

      setLocalStatus('Adding permitted actions...');
      await addPermittedActions({
        wallet: userPkpWallet,
        agentPKPTokenId: readAuthInfo.authInfo.userPKP.tokenId,
        toolIpfsCids: Object.keys(formData),
      });

      try {
        setLocalStatus('Updating to new version...');
        await permitApp({
          signer: userPkpWallet,
          args: {
            pkpTokenId: readAuthInfo.authInfo.agentPKP!.tokenId,
            appId: consentInfoMap.app.appId.toString(),
            appVersion: consentInfoMap.app.activeVersion!.toString(),
            permissionData: formData,
          },
        });

        setLocalStatus(null);
        // Show success state for 3 seconds, then refresh to app page
        setLocalSuccess('Version updated successfully!');
        setTimeout(() => {
          setLocalSuccess(null);
          window.location.href = `/user/appId/${consentInfoMap.app.appId}`;
        }, 3000);
      } catch (error) {
        setLocalError(error instanceof Error ? error.message : 'Failed to update version');
        setLocalStatus(null);
        return;
      }
    } else {
      setLocalStatus(null);
    }
  }, [formData, readAuthInfo, addPermittedActions, consentInfoMap.app]);

  const handleDecline = useCallback(() => {
    console.log('Declined');
  }, []);

  const registerFormRef = useCallback((policyIpfsCid: string, ref: PolicyFormRef) => {
    formRefs.current[policyIpfsCid] = ref;
  }, []);

  const isLoading = isActionsLoading || !!localStatus || !!localSuccess;
  const loadingStatus = actionsLoadingStatus || localStatus;
  const error = actionsError;

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${themeStyles.bg} p-4`}>
      {/* Main Card Container */}
      <div
        className={`max-w-6xl mx-auto ${themeStyles.mainCard} border ${themeStyles.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden`}
      >

        <div className="px-6 py-8 space-y-6">
          {/* Warning Banner */}
          <InfoBanner theme={themeStyles} />

          {/* App Header */}
          <ConsentAppHeader app={consentInfoMap.app} theme={themeStyles} />

          {/* Apps and Versions */}
          <AppsInfo
            consentInfoMap={consentInfoMap}
            theme={themeStyles}
            isDark={isDark}
            formData={formData}
            onFormChange={handleFormChange}
            onRegisterFormRef={registerFormRef}
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
          <ActionButtons
            onDecline={handleDecline}
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
