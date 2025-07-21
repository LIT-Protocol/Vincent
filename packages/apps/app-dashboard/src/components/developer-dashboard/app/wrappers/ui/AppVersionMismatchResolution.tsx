import { useEffect, useState } from 'react';
import { Upload, RotateCcw } from 'lucide-react';
import { ethers } from 'ethers';
import { enableAppVersion as enableAppVersionOnChain } from '@lit-protocol/vincent-contracts-sdk';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import MutationButtonStates, { SkeletonButton } from '@/components/shared/ui/MutationButtonStates';
import { StatusMessage } from '@/components/shared/ui/statusMessage';

type AppVersionMismatchResolutionProps = {
  appId: number;
  versionId: number;
  registryEnabled: boolean;
  onChainEnabled: boolean;
  refetchBlockchainAppVersionData: () => void;
};

export function AppVersionMismatchResolution({
  appId,
  versionId,
  registryEnabled,
  onChainEnabled,
  refetchBlockchainAppVersionData,
}: AppVersionMismatchResolutionProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Mutations for enable/disable
  const [enableAppVersion, { isLoading: isEnabling, error: enableAppVersionError }] =
    vincentApiClient.useEnableAppVersionMutation();
  const [disableAppVersion, { isLoading: isDisabling, error: disableAppVersionError }] =
    vincentApiClient.useDisableAppVersionMutation();

  // Handler for mismatch resolution - commit registry state to on-chain
  const handleCommitToOnChain = async () => {
    setError(null);
    setIsProcessing(true);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();

      await enableAppVersionOnChain({
        signer: signer,
        args: {
          appId: Number(appId),
          appVersion: Number(versionId),
          enabled: registryEnabled,
        },
      });

      const action = registryEnabled ? 'enabled' : 'disabled';
      setSuccess(`App version ${action} on-chain successfully!`);

      setTimeout(() => {
        refetchBlockchainAppVersionData();
      }, 3000);
    } catch (error: any) {
      if (error?.message?.includes('user rejected')) {
        setError('Transaction rejected.');
      } else {
        setError(error.message || 'Failed to update on-chain state. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler for mismatch resolution - revert registry to match on-chain
  const handleRevertRegistry = async () => {
    setError(null);
    setIsProcessing(true);

    try {
      if (onChainEnabled) {
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

      const action = onChainEnabled ? 'enabled' : 'disabled';
      setSuccess(`Registry reverted - app version is now ${action} to match on-chain!`);

      setTimeout(() => {
        refetchBlockchainAppVersionData();
      }, 1000);
    } catch (error: any) {
      setError(error.message || 'Failed to revert registry changes. Please try again.');
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

  return (
    <div className="space-y-3">
      <StatusMessage
        message={`Version state mismatch: Registry shows ${registryEnabled ? 'enabled' : 'disabled'} but on-chain shows ${onChainEnabled ? 'enabled' : 'disabled'}. Please resolve this mismatch.`}
        type="error"
      />

      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border">
        <p className="font-medium mb-1">Choose how to resolve this mismatch:</p>
        <p>
          On-chain: <span className="font-medium">{onChainEnabled ? 'Enabled' : 'Disabled'}</span> •
          Registry: <span className="font-medium">{registryEnabled ? 'Enabled' : 'Disabled'}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCommitToOnChain}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={`Update on-chain to ${registryEnabled ? 'enabled' : 'disabled'} (requires transaction)`}
        >
          {isLoading ? (
            <SkeletonButton />
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Update On-chain
            </>
          )}
        </button>

        <button
          onClick={handleRevertRegistry}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 border border-orange-300 rounded-lg text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={`Revert registry to ${onChainEnabled ? 'enabled' : 'disabled'} (no transaction required)`}
        >
          {isLoading ? (
            <SkeletonButton />
          ) : (
            <>
              <RotateCcw className="h-4 w-4" />
              Revert Registry
            </>
          )}
        </button>
      </div>
    </div>
  );
}
