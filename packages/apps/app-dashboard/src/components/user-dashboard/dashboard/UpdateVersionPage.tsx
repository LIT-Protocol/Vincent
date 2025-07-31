import { useState, useCallback, useRef } from 'react';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { ConnectInfoMap } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { useConnectFormData } from '@/hooks/user-dashboard/connect/useConnectFormData';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { PolicyFormRef } from '@/components/user-dashboard/connect/ui/PolicyForm';
import { UseReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { useAddPermittedActions } from '@/hooks/user-dashboard/connect/useAddPermittedActions';
import { ConnectAppHeader } from '@/components/user-dashboard/connect/ui/ConnectAppHeader';
import { AppsInfo } from '@/components/user-dashboard/connect/ui/AppInfo';
import { ActionButtons } from '@/components/user-dashboard/connect/ui/ActionButtons';
import { InfoBanner } from '@/components/user-dashboard/connect/ui/InfoBanner';
import { StatusCard } from '@/components/user-dashboard/connect/ui/StatusCard';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { litNodeClient } from '@/utils/user-dashboard/lit';
import { PageHeader } from './ui/PageHeader';
import { useNavigate } from 'react-router-dom';

interface UpdateVersionPageProps {
  connectInfoMap: ConnectInfoMap;
  readAuthInfo: UseReadAuthInfo;
}

export function UpdateVersionPage({ connectInfoMap, readAuthInfo }: UpdateVersionPageProps) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const formRefs = useRef<Record<string, PolicyFormRef>>({});
  const navigate = useNavigate();

  const { formData, handleFormChange } = useConnectFormData(connectInfoMap);

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
        abilityIpfsCids: Object.keys(formData),
      });

      try {
        setLocalStatus('Updating to new version...');
        const client = getClient({ signer: userPkpWallet });
        await client.permitApp({
          pkpEthAddress: readAuthInfo.authInfo.agentPKP!.ethAddress,
          appId: Number(connectInfoMap.app.appId),
          appVersion: Number(connectInfoMap.app.activeVersion),
          permissionData: formData,
        });

        setLocalStatus(null);
        // Show success state for 3 seconds, then refresh to app page
        setLocalSuccess('Version updated successfully!');
        setTimeout(() => {
          setLocalSuccess(null);
          window.location.href = `/user/appId/${connectInfoMap.app.appId}`;
        }, 3000);
      } catch (error) {
        setLocalError(error instanceof Error ? error.message : 'Failed to update version');
        setLocalStatus(null);
        return;
      }
    } else {
      setLocalStatus(null);
    }
  }, [formData, readAuthInfo, addPermittedActions, connectInfoMap.app]);

  const handleDecline = useCallback(() => {
    navigate(`/user/appId/${connectInfoMap.app.appId}`);
  }, [connectInfoMap.app.appId, navigate]);

  const registerFormRef = useCallback((policyIpfsCid: string, ref: PolicyFormRef) => {
    formRefs.current[policyIpfsCid] = ref;
  }, []);

  const isLoading = isActionsLoading || !!localStatus || !!localSuccess;
  const loadingStatus = actionsLoadingStatus || localStatus;
  const error = actionsError;

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${theme.bg} sm:p-4`}>
      {/* Main Card Container */}
      <div
        className={`max-w-6xl mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden`}
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

        <div className="px-6 py-8 space-y-6">
          {/* Warning Banner */}
          <InfoBanner />

          {/* App Header */}
          <ConnectAppHeader app={connectInfoMap.app} />

          {/* Apps and Versions */}
          <AppsInfo
            connectInfoMap={connectInfoMap}
            formData={formData}
            onFormChange={handleFormChange}
            onRegisterFormRef={registerFormRef}
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
    </div>
  );
}
