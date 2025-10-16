import { useState, useEffect } from 'react';
import { Power, PowerOff } from 'lucide-react';
import { AppVersion } from '@/types/developer-dashboard/appTypes';
import { AppVersion as ContractAppVersion, getClient } from '@lit-protocol/vincent-contracts-sdk';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import MutationButtonStates from '@/components/shared/ui/MutationButtonStates';
import { AppVersionMismatchResolution } from './AppVersionMismatchResolution';
import { initPkpSigner } from '@/utils/developer-dashboard/initPkpSigner';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { ActionButton } from '@/components/developer-dashboard/ui/ActionButton';

interface AppVersionPublishedButtonsProps {
  appId: number;
  versionId: number;
  appVersionData: AppVersion;
  appVersionBlockchainData: ContractAppVersion;
  refetchBlockchainAppVersionData: () => void;
}

export function AppVersionPublishedButtons({
  appId,
  versionId,
  appVersionData,
  appVersionBlockchainData,
  refetchBlockchainAppVersionData,
}: AppVersionPublishedButtonsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { authInfo, sessionSigs } = useReadAuthInfo();

  // Mutations for enable/disable
  const [enableAppVersion, { isLoading: isEnabling, error: enableAppVersionError }] =
    vincentApiClient.useEnableAppVersionMutation();
  const [disableAppVersion, { isLoading: isDisabling, error: disableAppVersionError }] =
    vincentApiClient.useDisableAppVersionMutation();

  const registryEnabled = appVersionData.enabled;
  const onChainEnabled = appVersionBlockchainData.enabled;

  // Determine if there's a mismatch (only when not processing)
  const hasMismatch = !isProcessing && registryEnabled !== onChainEnabled;

  // Unified handler for enable/disable operations
  const handleVersionToggle = async (targetState: boolean) => {
    setError(null);
    setIsProcessing(true);

    try {
      // Step 1: Update registry
      if (targetState) {
        await enableAppVersion({
          appId: Number(appId),
          version: Number(versionId),
        });
      } else {
        await disableAppVersion({
          appId: Number(appId),
          version: Number(versionId),
        });
      }

      // Step 2: Update on-chain
      const pkpSigner = await initPkpSigner({ authInfo, sessionSigs });
      const client = getClient({ signer: pkpSigner });

      await client.enableAppVersion({
        appId: Number(appId),
        appVersion: Number(versionId),
        enabled: targetState,
      });

      const action = targetState ? 'enabled' : 'disabled';
      setSuccess(`App version ${action} successfully!`);

      setTimeout(() => {
        refetchBlockchainAppVersionData();
      }, 3000);
    } catch (error) {
      console.error('Failed to toggle app version:', error);
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('user rejected')) {
        setError('Transaction rejected.');
      } else {
        const action = targetState ? 'enable' : 'disable';
        setError(`Failed to ${action} app version. Please try again.`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [error]);

  const isLoading = isProcessing || isEnabling || isDisabling;

  if (error || enableAppVersionError || disableAppVersionError) {
    const extractMessage = (err: unknown): string | null => {
      if (!err) return null;
      if (typeof err === 'object' && 'message' in err) {
        return String(err.message);
      }
      return null;
    };
    const errorMessage =
      error ||
      extractMessage(enableAppVersionError) ||
      extractMessage(disableAppVersionError) ||
      'Failed to update app version.';
    return <MutationButtonStates type="error" errorMessage={errorMessage} />;
  }

  if (success) {
    return <MutationButtonStates type="success" successMessage={success} />;
  }

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Enable Button - Only show when disabled */}
      {!registryEnabled && (
        <ActionButton
          icon={Power}
          title="Enable App Version"
          description="Make version available for use"
          onClick={() => handleVersionToggle(true)}
          isLoading={isLoading}
          variant="success"
          borderColor="rgb(134 239 172 / 0.3)"
          hoverBorderColor={theme.brandOrange}
        />
      )}

      {/* Disable Button - Only show when enabled */}
      {registryEnabled && (
        <ActionButton
          icon={PowerOff}
          title="Disable App Version"
          description="Disable this version from use"
          onClick={() => handleVersionToggle(false)}
          isLoading={isLoading}
          variant="danger"
          borderColor="rgb(252 165 165 / 0.3)"
          hoverBorderColor={theme.brandOrange}
        />
      )}
    </div>
  );
}
