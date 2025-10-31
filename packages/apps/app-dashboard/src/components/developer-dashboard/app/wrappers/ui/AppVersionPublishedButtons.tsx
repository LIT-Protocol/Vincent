import { useState } from 'react';
import { Power, PowerOff, CheckCircle } from 'lucide-react';
import { AppVersion } from '@/types/developer-dashboard/appTypes';
import { AppVersion as ContractAppVersion, getClient } from '@lit-protocol/vincent-contracts-sdk';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { AppVersionMismatchResolution } from './AppVersionMismatchResolution';
import { initPkpSigner } from '@/utils/developer-dashboard/initPkpSigner';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { ActionButton } from '@/components/developer-dashboard/ui/ActionButton';
import { StatusMessage } from '@/components/shared/ui/statusMessage';

interface AppVersionPublishedButtonsProps {
  appId: number;
  versionId: number;
  appVersionData: AppVersion;
  appVersionBlockchainData: ContractAppVersion;
  refetchBlockchainAppVersionData: () => void;
  appActiveVersion?: number | null;
}

export function AppVersionPublishedButtons({
  appId,
  versionId,
  appVersionData,
  appVersionBlockchainData,
  refetchBlockchainAppVersionData,
  appActiveVersion,
}: AppVersionPublishedButtonsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<'enable' | 'disable' | 'setActive' | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const { authInfo, sessionSigs } = useReadAuthInfo();

  // Mutations for enable/disable
  const [enableAppVersion, { isLoading: isEnabling }] =
    vincentApiClient.useEnableAppVersionMutation();
  const [disableAppVersion, { isLoading: isDisabling }] =
    vincentApiClient.useDisableAppVersionMutation();
  const [setActiveVersion, { isLoading: isSettingActive }] =
    vincentApiClient.useSetAppActiveVersionMutation();

  const registryEnabled = appVersionData.enabled;
  const onChainEnabled = appVersionBlockchainData.enabled;

  // Determine if there's a mismatch (only when not processing)
  const hasMismatch = !isProcessing && registryEnabled !== onChainEnabled;

  // Unified handler for enable/disable operations
  const handleVersionToggle = async (targetState: boolean) => {
    setActionSuccess(null);
    setActionError(null);
    setIsProcessing(true);

    try {
      // Step 1: Update registry
      if (targetState) {
        await enableAppVersion({
          appId: Number(appId),
          version: Number(versionId),
        }).unwrap();
      } else {
        await disableAppVersion({
          appId: Number(appId),
          version: Number(versionId),
        }).unwrap();
      }

      // Step 2: Update on-chain
      const pkpSigner = await initPkpSigner({ authInfo, sessionSigs });
      const client = getClient({ signer: pkpSigner });

      await client.enableAppVersion({
        appId: Number(appId),
        appVersion: Number(versionId),
        enabled: targetState,
      });

      refetchBlockchainAppVersionData();

      setActionSuccess(targetState ? 'enable' : 'disable');

      // Clear success state after 3 seconds
      setTimeout(() => {
        setActionSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Failed to toggle app version:', error);
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('user rejected')) {
        setActionError('Transaction rejected');
      } else {
        const action = targetState ? 'enable' : 'disable';
        setActionError(`Failed to ${action} version`);
      }

      // Clear error after 5 seconds
      setTimeout(() => {
        setActionError(null);
      }, 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler for setting active version
  const handleSetActiveVersion = async () => {
    setActionSuccess(null);
    setActionError(null);
    setIsProcessing(true);

    try {
      await setActiveVersion({
        appId: Number(appId),
        appSetActiveVersion: {
          activeVersion: Number(versionId),
        },
      }).unwrap();

      refetchBlockchainAppVersionData();

      setActionSuccess('setActive');

      // Clear success state after 3 seconds
      setTimeout(() => {
        setActionSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Failed to set active version:', error);
      const message = error instanceof Error ? error.message : String(error);
      setActionError(`Failed to set active version: ${message}`);

      // Clear error after 5 seconds
      setTimeout(() => {
        setActionError(null);
      }, 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = isProcessing || isEnabling || isDisabling || isSettingActive;
  const isActiveVersion = appActiveVersion === versionId;

  // Show mismatch resolution component if there's a mismatch
  if (hasMismatch) {
    return (
      <AppVersionMismatchResolution
        appId={appId}
        versionId={versionId}
        registryEnabled={registryEnabled}
        onChainEnabled={onChainEnabled}
        refetchBlockchainAppVersionData={refetchBlockchainAppVersionData}
      />
    );
  }

  // Show regular enable/disable buttons when states are in sync
  return (
    <div className="space-y-4">
      {/* Error Message */}
      {actionError && <StatusMessage message={actionError} type="error" />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Set as Active Version Button - Only show when not active and enabled */}
        {!isActiveVersion && registryEnabled && (
          <ActionButton
            icon={actionSuccess === 'setActive' ? CheckCircle : CheckCircle}
            title={actionSuccess === 'setActive' ? 'Set as Active!' : 'Set as Active Version'}
            description={
              actionSuccess === 'setActive'
                ? 'Version set as active successfully'
                : 'Make this the active app version'
            }
            onClick={handleSetActiveVersion}
            isLoading={isLoading}
            disabled={actionSuccess === 'setActive'}
            variant={actionSuccess === 'setActive' ? 'success' : 'orange'}
            borderColor="rgb(191 219 254 / 0.3)"
            hoverBorderColor={theme.brandOrange}
          />
        )}

        {/* Enable Button - Only show when disabled */}
        {!registryEnabled && (
          <ActionButton
            icon={actionSuccess === 'enable' ? CheckCircle : Power}
            title={actionSuccess === 'enable' ? 'Enabled!' : 'Enable App Version'}
            description={
              actionSuccess === 'enable'
                ? 'Version enabled successfully'
                : 'Make version available for use'
            }
            onClick={() => handleVersionToggle(true)}
            isLoading={isLoading}
            disabled={actionSuccess === 'enable'}
            variant={actionSuccess === 'enable' ? 'success' : 'success'}
            borderColor="rgb(134 239 172 / 0.3)"
            hoverBorderColor={theme.brandOrange}
          />
        )}

        {/* Disable Button - Only show when enabled */}
        {registryEnabled && (
          <ActionButton
            icon={actionSuccess === 'disable' ? CheckCircle : PowerOff}
            title={actionSuccess === 'disable' ? 'Disabled!' : 'Disable App Version'}
            description={
              actionSuccess === 'disable'
                ? 'Version disabled successfully'
                : 'Disable this version from use'
            }
            onClick={() => handleVersionToggle(false)}
            isLoading={isLoading}
            disabled={actionSuccess === 'disable'}
            variant={actionSuccess === 'disable' ? 'success' : 'danger'}
            borderColor="rgb(252 165 165 / 0.3)"
            hoverBorderColor={theme.brandOrange}
          />
        )}
      </div>
    </div>
  );
}
