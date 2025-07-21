import { useEffect, useState } from 'react';
import { Upload, RotateCcw } from 'lucide-react';
import { ethers } from 'ethers';
import { deleteApp, undeleteApp } from '@lit-protocol/vincent-contracts-sdk';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import MutationButtonStates, { SkeletonButton } from '@/components/shared/ui/MutationButtonStates';
import { StatusMessage } from '@/components/shared/ui/statusMessage';

type AppMismatchResolutionProps = {
  appId: number;
  registryDeleted: boolean;
  onChainDeleted: boolean;
  refetchBlockchainData: () => void;
};

export function AppMismatchResolution({
  appId,
  registryDeleted,
  onChainDeleted,
  refetchBlockchainData,
}: AppMismatchResolutionProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Registry mutations
  const [deleteAppInRegistry, { isLoading: isDeletingInRegistry, error: deleteAppError }] =
    vincentApiClient.useDeleteAppMutation();
  const [undeleteAppInRegistry, { isLoading: isUndeletingInRegistry, error: undeleteAppError }] =
    vincentApiClient.useUndeleteAppMutation();

  // Handler for mismatch resolution - commit registry state to on-chain
  const handleCommitToOnChain = async () => {
    setError(null);
    setIsProcessing(true);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();

      if (registryDeleted) {
        await deleteApp({
          signer: signer,
          args: {
            appId: Number(appId),
          },
        });
      } else {
        await undeleteApp({
          signer: signer,
          args: {
            appId: Number(appId),
          },
        });
      }

      const action = registryDeleted ? 'deleted' : 'undeleted';
      setSuccess(`App ${action} on-chain successfully!`);

      setTimeout(() => {
        refetchBlockchainData();
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
      if (onChainDeleted) {
        await deleteAppInRegistry({
          appId: appId,
        });
      } else {
        await undeleteAppInRegistry({
          appId: appId,
        });
      }

      const action = onChainDeleted ? 'deleted' : 'undeleted';
      setSuccess(`Registry reverted - app is now ${action} to match on-chain!`);

      setTimeout(() => {
        refetchBlockchainData();
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

  const isLoading = isProcessing || isDeletingInRegistry || isUndeletingInRegistry;

  if (error || deleteAppError || undeleteAppError) {
    const errorMessage =
      error ||
      (deleteAppError as any)?.message ||
      (undeleteAppError as any)?.message ||
      'Failed to update app.';
    return <MutationButtonStates type="error" errorMessage={errorMessage} />;
  }

  if (success) {
    return <MutationButtonStates type="success" successMessage={success} />;
  }

  return (
    <div className="space-y-3">
      <StatusMessage
        message={`App state mismatch: Registry shows ${registryDeleted ? 'deleted' : 'active'} but on-chain shows ${onChainDeleted ? 'deleted' : 'active'}. Please resolve this mismatch.`}
        type="error"
      />

      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border">
        <p className="font-medium mb-1">Choose how to resolve this mismatch:</p>
        <p>
          On-chain: <span className="font-medium">{onChainDeleted ? 'Deleted' : 'Active'}</span> •
          Registry: <span className="font-medium">{registryDeleted ? 'Deleted' : 'Active'}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCommitToOnChain}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={`Update on-chain to ${registryDeleted ? 'deleted' : 'active'} (requires transaction)`}
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
          title={`Revert registry to ${onChainDeleted ? 'deleted' : 'active'} (no transaction required)`}
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
