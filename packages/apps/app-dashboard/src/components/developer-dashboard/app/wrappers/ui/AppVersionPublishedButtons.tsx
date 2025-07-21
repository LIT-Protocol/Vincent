import { useEffect, useState } from 'react';
import { Power, PowerOff } from 'lucide-react';
import { ethers } from 'ethers';
import { AppVersion } from '@/types/developer-dashboard/appTypes';
import {
  AppVersion as ContractAppVersion,
  enableAppVersion as enableAppVersionOnChain,
} from '@lit-protocol/vincent-contracts-sdk';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import MutationButtonStates, { SkeletonButton } from '@/components/shared/ui/MutationButtonStates';
import { AppVersionMismatchResolution } from './AppVersionMismatchResolution';

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
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();

      await enableAppVersionOnChain({
        signer: signer,
        args: {
          appId: Number(appId),
          appVersion: Number(versionId),
          enabled: targetState,
        },
      });

      const action = targetState ? 'enabled' : 'disabled';
      setSuccess(`App version ${action} successfully!`);

      setTimeout(() => {
        refetchBlockchainAppVersionData();
      }, 3000);
    } catch (error: any) {
      if (error?.message?.includes('user rejected')) {
        setError('Transaction rejected.');
      } else {
        const action = targetState ? 'enable' : 'disable';
        setError(error.message || `Failed to ${action} app version. Please try again.`);
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
    const errorMessage =
      error ||
      (enableAppVersionError as any)?.message ||
      (disableAppVersionError as any)?.message ||
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
    <div className="flex flex-wrap gap-3">
      {/* Enable Button - Only show when disabled */}
      {!registryEnabled && (
        <button
          onClick={() => handleVersionToggle(true)}
          disabled={isLoading}
          className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium bg-white transition-colors border-green-300 text-green-700 hover:bg-green-50 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <SkeletonButton />
          ) : (
            <>
              <Power className="h-4 w-4" />
              Enable App Version
            </>
          )}
        </button>
      )}

      {/* Disable Button - Only show when enabled */}
      {registryEnabled && (
        <button
          onClick={() => handleVersionToggle(false)}
          disabled={isLoading}
          className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium bg-white transition-colors border-red-300 text-red-700 hover:bg-red-50 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <SkeletonButton />
          ) : (
            <>
              <PowerOff className="h-4 w-4" />
              Disable App Version
            </>
          )}
        </button>
      )}
    </div>
  );
}
