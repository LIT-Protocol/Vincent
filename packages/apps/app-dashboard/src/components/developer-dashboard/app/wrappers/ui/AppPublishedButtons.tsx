import { useState, useEffect } from 'react';
import { Plus, Users, Trash2, Edit, RotateCcw } from 'lucide-react';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { App } from '@/types/developer-dashboard/appTypes';
import { App as ContractApp } from '@lit-protocol/vincent-contracts-sdk';
import MutationButtonStates, { SkeletonButton } from '@/components/shared/ui/MutationButtonStates';
import { AppMismatchResolution } from './AppMismatchResolution';
import { initPkpSigner } from '@/utils/developer-dashboard/initPkpSigner';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';

interface AppPublishedButtonsProps {
  appData: App;
  appBlockchainData: ContractApp;
  onOpenMutation: (mutationType: string) => void;
  refetchBlockchainData: () => void;
}

export function AppPublishedButtons({
  appData,
  appBlockchainData,
  onOpenMutation,
  refetchBlockchainData,
}: AppPublishedButtonsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { authInfo, sessionSigs } = useReadAuthInfo();

  // Registry mutations
  const [deleteAppInRegistry, { isLoading: isDeletingInRegistry, error: deleteAppError }] =
    vincentApiClient.useDeleteAppMutation();
  const [undeleteAppInRegistry, { isLoading: isUndeletingInRegistry, error: undeleteAppError }] =
    vincentApiClient.useUndeleteAppMutation();

  const registryDeleted = appData.isDeleted!; // Only null for staging
  const onChainDeleted = appBlockchainData.isDeleted;

  // Determine if there's a mismatch (only when not processing)
  const hasMismatch = !isProcessing && registryDeleted !== onChainDeleted;

  // Unified handler for app toggle (delete/undelete)
  const handleAppToggle = async (targetDeleted: boolean) => {
    setError(null);
    setIsProcessing(true);

    try {
      // Step 1: Update registry
      if (targetDeleted) {
        await deleteAppInRegistry({
          appId: appData.appId,
        });
      } else {
        await undeleteAppInRegistry({
          appId: appData.appId,
        });
      }

      // Step 2: Update on-chain
      const pkpSigner = await initPkpSigner({ authInfo, sessionSigs });
      const client = getClient({ signer: pkpSigner });

      if (targetDeleted) {
        await client.deleteApp({
          appId: Number(appData.appId),
        });
      } else {
        await client.undeleteApp({
          appId: appData.appId,
        });
      }

      const action = targetDeleted ? 'deleted' : 'undeleted';
      setSuccess(`App ${action} successfully!`);

      setTimeout(() => {
        refetchBlockchainData();
      }, 3000);
    } catch (error: any) {
      if (error?.message?.includes('user rejected')) {
        setError('Transaction rejected.');
      } else {
        const action = targetDeleted ? 'delete' : 'undelete';
        setError(error.message || `Failed to ${action} app. Please try again.`);
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

  // Show mismatch resolution component if there's a mismatch
  if (hasMismatch) {
    return (
      <AppMismatchResolution
        appId={Number(appData.appId)}
        registryDeleted={registryDeleted}
        onChainDeleted={onChainDeleted}
        refetchBlockchainData={refetchBlockchainData}
      />
    );
  }

  // Show regular delete/undelete buttons when states are in sync
  return (
    <div className="flex flex-wrap gap-3">
      {/* Regular buttons when not deleted */}
      {!registryDeleted && (
        <>
          <button
            onClick={() => onOpenMutation('edit-published-app')}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit App
          </button>
          <button
            onClick={() => onOpenMutation('create-app-version')}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create App Version
          </button>
          <button
            onClick={() => onOpenMutation('manage-delegatees')}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Users className="h-4 w-4" />
            Manage Delegatees
          </button>
          <button
            onClick={() => handleAppToggle(true)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <SkeletonButton />
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete App
              </>
            )}
          </button>
        </>
      )}

      {/* Undelete button when deleted */}
      {registryDeleted && (
        <button
          onClick={() => handleAppToggle(!registryDeleted)}
          disabled={isLoading}
          className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            registryDeleted
              ? 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
              : 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
          }`}
        >
          {isLoading ? (
            <SkeletonButton />
          ) : (
            <>
              <RotateCcw className="h-4 w-4" />
              {registryDeleted ? 'Undelete App' : 'Delete App'}
            </>
          )}
        </button>
      )}
    </div>
  );
}
