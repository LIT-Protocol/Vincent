import { useState, useCallback, useRef } from 'react';
import { permitApp } from '@lit-protocol/vincent-contracts-sdk';
import { ConsentInfoMap } from '@/hooks/user-dashboard/consent/useConsentInfo';
import { useConsentFormData } from '@/hooks/user-dashboard/consent/useConsentFormData';
import { ConsentPageHeader } from './ui/ConsentPageHeader';
import { theme } from './ui/theme';
import { PolicyFormRef } from './ui/PolicyForm';
import { UseReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { useAddPermittedActions } from '@/hooks/user-dashboard/consent/useAddPermittedActions';
import { ConsentAppHeader } from './ui/ConsentAppHeader';
import { AppsInfo } from './ui/AppInfo';
import { ActionButtons } from './ui/ActionButtons';
import { InfoBanner } from './ui/InfoBanner';
import { StatusCard } from './ui/StatusCard';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { litNodeClient } from '@/utils/user-dashboard/lit';
import { useJwtRedirect } from '@/hooks/user-dashboard/consent/useJwtRedirect';
import { useTheme } from '@/providers/ThemeProvider';

interface ConsentPageProps {
  consentInfoMap: ConsentInfoMap;
  readAuthInfo: UseReadAuthInfo;
}

export function ConsentPage({ consentInfoMap, readAuthInfo }: ConsentPageProps) {
  const { isDark, toggleTheme } = useTheme();
  const [localError, setLocalError] = useState<string | null>(null);
  const formRefs = useRef<Record<string, PolicyFormRef>>({});

  const { formData, handleFormChange } = useConsentFormData(consentInfoMap);
  const {
    generateJWT,
    isLoading: isJwtLoading,
    loadingStatus: jwtLoadingStatus,
    error: jwtError,
  } = useJwtRedirect({ readAuthInfo });
  const {
    addPermittedActions,
    isLoading: isActionsLoading,
    loadingStatus: actionsLoadingStatus,
    error: actionsError,
  } = useAddPermittedActions();

  // Use the theme function
  const themeStyles = theme(isDark);

  const handleSubmit = useCallback(async () => {
    // Clear any previous local errors
    setLocalError(null);

    // Check if all forms are valid using RJSF's built-in validateForm method
    const allValid = Object.values(formRefs.current).every((formRef) => {
      return formRef.validateForm();
    });

    if (allValid) {
      if (!readAuthInfo.authInfo?.userPKP || !readAuthInfo.sessionSigs) {
        setLocalError('Missing authentication information. Please try refreshing the page.');
        return;
      }

      console.log('formData', formData);

      const userPkpWallet = new PKPEthersWallet({
        controllerSessionSigs: readAuthInfo.sessionSigs,
        pkpPubKey: readAuthInfo.authInfo.userPKP.publicKey,
        litNodeClient: litNodeClient,
      });
      await userPkpWallet.init();

      await addPermittedActions({
        wallet: userPkpWallet,
        agentPKPTokenId: readAuthInfo.authInfo.userPKP.tokenId,
        toolIpfsCids: Object.keys(formData),
      });

      try {
        await permitApp({
          signer: userPkpWallet,
          args: {
            pkpTokenId: readAuthInfo.authInfo.agentPKP!.tokenId,
            appId: consentInfoMap.app.appId.toString(),
            appVersion: consentInfoMap.app.activeVersion!.toString(),
            permissionData: formData,
          },
        });
      } catch (error) {
        setLocalError(error instanceof Error ? error.message : 'Failed to permit app');
        return;
      }
      await generateJWT(consentInfoMap.app, consentInfoMap.app.activeVersion!); // ! since this will be valid. Only optional in the schema doc for init creation.
    }
  }, [formData, readAuthInfo, addPermittedActions]);

  const handleDecline = useCallback(() => {
    console.log('Declined');
  }, []);

  const registerFormRef = useCallback((policyIpfsCid: string, ref: PolicyFormRef) => {
    formRefs.current[policyIpfsCid] = ref;
  }, []);

  const isLoading = isJwtLoading || isActionsLoading;
  const loadingStatus = jwtLoadingStatus || actionsLoadingStatus;
  const error = jwtError || actionsError;

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${themeStyles.bg} p-4`}>
      {/* Main Card Container */}
      <div
        className={`max-w-6xl mx-auto ${themeStyles.mainCard} border ${themeStyles.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden`}
      >
        {/* Header */}
        <ConsentPageHeader
          isDark={isDark}
          onToggleTheme={toggleTheme}
          theme={themeStyles}
          authInfo={readAuthInfo.authInfo!}
        />

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
