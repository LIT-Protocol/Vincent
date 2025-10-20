import { useState, useEffect } from 'react';
import * as Sentry from '@sentry/react';
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
  const [undeleteAppInRegistry, { isLoading: isUndeletingInRegistry, error: undeleteAppError }] =
    vincentApiClient.useUndeleteAppMutation();

  const registryDeleted = appData.isDeleted!; // Only null for staging
  const onChainDeleted = appBlockchainData.isDeleted;

  // Determine if there's a mismatch (only when not processing)
  const hasMismatch = !isProcessing && registryDeleted !== onChainDeleted;

  // Handler for app undelete
  const handleUndelete = async () => {
    setError(null);
    setIsProcessing(true);

    try {
      // Step 1: Update registry
      await undeleteAppInRegistry({
        appId: appData.appId,
      });

      // Step 2: Update on-chain
      const pkpSigner = await initPkpSigner({ authInfo, sessionSigs });
      const client = getClient({ signer: pkpSigner });

      await client.undeleteApp({
        appId: appData.appId,
      });

      setSuccess(`App undeleted successfully!`);

      setTimeout(() => {
        refetchBlockchainData();
      }, 3000);
    } catch (error: any) {
      if (error?.message?.includes('user rejected')) {
        setError('Transaction rejected.');
      } else {
        setError(error.message || `Failed to undelete app. Please try again.`);
        Sentry.captureException(error, {
          extra: {
            context: 'AppPublishedButtons.undeleteApp',
            userPkp: authInfo?.userPKP?.ethAddress,
          },
        });
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

  const isLoading = isProcessing || isUndeletingInRegistry;

  if (error || undeleteAppError) {
    const errorMessage = error || (undeleteAppError as any)?.message || 'Failed to update app.';
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
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg text-sm font-medium text-gray-700 dark:text-white/80 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit App
          </button>
          <button
            onClick={() => onOpenMutation('create-app-version')}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg text-sm font-medium text-gray-700 dark:text-white/80 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create App Version
          </button>
          <button
            onClick={() => onOpenMutation('manage-delegatees')}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg text-sm font-medium text-gray-700 dark:text-white/80 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <Users className="h-4 w-4" />
            Manage Delegatees
          </button>
          <button
            onClick={() => onOpenMutation('delete-app')}
            className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-500/30 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete App
          </button>
        </>
      )}

      {/* Undelete button when deleted */}
      {registryDeleted && (
        <button
          onClick={handleUndelete}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 border border-green-300 dark:border-green-500/30 rounded-lg text-sm font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-neutral-800 hover:bg-green-100 dark:hover:bg-green-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <SkeletonButton />
          ) : (
            <>
              <RotateCcw className="h-4 w-4" />
              Undelete App
            </>
          )}
        </button>
      )}
    </div>
  );
}
