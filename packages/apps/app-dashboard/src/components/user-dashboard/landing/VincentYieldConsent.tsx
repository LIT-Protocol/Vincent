import { useState, useCallback, useRef } from 'react';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { ConnectInfoMap } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { useConnectFormData } from '@/hooks/user-dashboard/connect/useConnectFormData';
import { PolicyFormRef } from '../connect/ui/PolicyForm';
import { UseReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { useAddPermittedActions } from '@/hooks/user-dashboard/connect/useAddPermittedActions';
import { AppsInfo } from '../connect/ui/AppInfo';
import { StatusCard } from '../connect/ui/StatusCard';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { litNodeClient } from '@/utils/user-dashboard/lit';
import { Button } from '@/components/shared/ui/button';

interface VincentYieldConsentProps {
  connectInfoMap: ConnectInfoMap;
  readAuthInfo: UseReadAuthInfo;
  onSuccess: () => void;
  onCancel: () => void;
}

export function VincentYieldConsent({
  connectInfoMap,
  readAuthInfo,
  onSuccess,
  onCancel,
}: VincentYieldConsentProps) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const [isConnectProcessing, setIsConnectProcessing] = useState(false);
  const formRefs = useRef<Record<string, PolicyFormRef>>({});

  const { formData, handleFormChange } = useConnectFormData(connectInfoMap);
  const {
    addPermittedActions,
    isLoading: isActionsLoading,
    loadingStatus: actionsLoadingStatus,
    error: actionsError,
  } = useAddPermittedActions();

  const handleSubmit = useCallback(async () => {
    setLocalError(null);
    setLocalSuccess(null);
    setIsConnectProcessing(true);

    // Check if all forms are valid
    const allValid = Object.values(formRefs.current).every((formRef) => {
      return formRef.validateForm();
    });

    if (allValid) {
      if (!readAuthInfo.authInfo?.userPKP || !readAuthInfo.sessionSigs) {
        setLocalError('Missing authentication information. Please try refreshing the page.');
        setIsConnectProcessing(false);
        return;
      }

      const userPkpWallet = new PKPEthersWallet({
        controllerSessionSigs: readAuthInfo.sessionSigs,
        pkpPubKey: readAuthInfo.authInfo.userPKP.publicKey,
        litNodeClient: litNodeClient,
      });
      await userPkpWallet.init();

      await addPermittedActions({
        wallet: userPkpWallet,
        agentPKPTokenId: readAuthInfo.authInfo.userPKP.tokenId,
        abilityIpfsCids: Object.keys(formData),
      });

      try {
        const client = getClient({ signer: userPkpWallet });
        await client.permitApp({
          pkpEthAddress: readAuthInfo.authInfo.agentPKP!.ethAddress,
          appId: Number(connectInfoMap.app.appId),
          appVersion: Number(connectInfoMap.app.activeVersion),
          permissionData: formData,
        });

        setIsConnectProcessing(false);
        setLocalSuccess('Permissions granted successfully!');

        // Call onSuccess after a brief delay to show success message
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } catch (error) {
        setLocalError(error instanceof Error ? error.message : 'Failed to permit app');
        setIsConnectProcessing(false);
      }
    } else {
      setLocalError('Some of your permissions are not valid. Please check the form and try again.');
      setIsConnectProcessing(false);
    }
  }, [formData, readAuthInfo, addPermittedActions, connectInfoMap.app, onSuccess]);

  const registerFormRef = useCallback((policyIpfsCid: string, ref: PolicyFormRef) => {
    formRefs.current[policyIpfsCid] = ref;
  }, []);

  const isLoading = isActionsLoading || isConnectProcessing || !!localSuccess;
  const loadingStatus =
    actionsLoadingStatus || (isConnectProcessing ? 'Processing permissions...' : null);
  const error = actionsError || localError;

  return (
    <div className="space-y-6">
      {/* App and Abilities Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <AppsInfo
          connectInfoMap={connectInfoMap}
          formData={formData}
          onFormChange={handleFormChange}
          onRegisterFormRef={registerFormRef}
        />
      </div>

      {/* Status Card */}
      {(isLoading || error || localSuccess) && (
        <StatusCard
          isLoading={isLoading}
          loadingStatus={loadingStatus}
          error={error}
          success={localSuccess}
        />
      )}

      {/* Action Buttons */}
      <div className="flex justify-between gap-3 pt-4">
        <Button onClick={onCancel} variant="outline" disabled={isLoading}>
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          {isLoading ? 'Processing...' : 'Grant Permissions'}
        </Button>
      </div>
    </div>
  );
}
