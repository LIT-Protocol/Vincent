import { useState, useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { Plus, Users, Trash2, Edit, RotateCcw, List } from 'lucide-react';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { App } from '@/types/developer-dashboard/appTypes';
import { App as ContractApp } from '@lit-protocol/vincent-contracts-sdk';
import MutationButtonStates from '@/components/shared/ui/MutationButtonStates';
import { AppMismatchResolution } from './AppMismatchResolution';
import { initPkpSigner } from '@/utils/developer-dashboard/initPkpSigner';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';
import { ActionButton } from '@/components/developer-dashboard/ui/ActionButton';

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

  const registryDeleted = appData.isDeleted ?? false;
  const onChainDeleted = appBlockchainData.isDeleted;

  // Determine if there's a mismatch (only when not processing)
  const hasMismatch = !isProcessing && registryDeleted !== onChainDeleted;

  // Handler for app undelete
  const handleUndelete = async () => {
    setError(null);
    setIsProcessing(true);

    try {
      // Step 1: Update on-chain first (if published)
      const pkpSigner = await initPkpSigner({ authInfo, sessionSigs });
      const client = getClient({ signer: pkpSigner });

      await client.undeleteApp({
        appId: appData.appId,
      });

      // Step 2: Update registry (only after on-chain succeeds)
      await undeleteAppInRegistry({
        appId: appData.appId,
      });

      setSuccess(`App undeleted successfully!`);

      setTimeout(() => {
        refetchBlockchainData();
      }, 3000);
    } catch (error) {
      console.error('Failed to undelete app:', error);
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('user rejected')) {
        setError('Transaction rejected.');
      } else {
        setError(`Failed to undelete app. Please try again.`);
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
    const errorMessage =
      error ||
      (undeleteAppError && typeof undeleteAppError === 'object' && 'message' in undeleteAppError
        ? String(undeleteAppError.message)
        : 'Failed to update app.');
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
    <div className="space-y-6">
      {/* Regular buttons when not deleted */}
      {!registryDeleted && (
        <>
          {/* App Management Section */}
          <div>
            <h4 className={`text-sm font-semibold ${theme.text} mb-3`} style={fonts.heading}>
              App Management
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ActionButton
                icon={Edit}
                title="Edit App"
                description="Update app details and settings"
                onClick={() => onOpenMutation('edit-published-app')}
                variant="orange"
                iconBg={`${theme.brandOrange}1A`}
                iconColor={theme.brandOrange}
                hoverBorderColor={theme.brandOrange}
              />

              <ActionButton
                icon={Users}
                title="Manage Delegatees"
                description="Update delegatee addresses"
                onClick={() => onOpenMutation('manage-delegatees')}
                variant="orange"
                iconBg={`${theme.brandOrange}1A`}
                iconColor={theme.brandOrange}
                hoverBorderColor={theme.brandOrange}
              />

              <ActionButton
                icon={Trash2}
                title="Delete App"
                description="Permanently remove this app"
                onClick={() => onOpenMutation('delete-app')}
                variant="danger"
                borderColor="rgb(254 202 202 / 0.5)"
                hoverBorderColor="rgb(239 68 68)"
              />
            </div>
          </div>

          {/* Version Management Section */}
          <div>
            <h4 className={`text-sm font-semibold ${theme.text} mb-3`} style={fonts.heading}>
              Version Management
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ActionButton
                icon={List}
                title="View Versions"
                description="View and manage app versions"
                onClick={() => onOpenMutation('versions')}
                variant="orange"
                iconBg={`${theme.brandOrange}1A`}
                iconColor={theme.brandOrange}
                hoverBorderColor={theme.brandOrange}
              />

              <ActionButton
                icon={Plus}
                title="New Version"
                description="Only one unpublished version allowed at a time"
                onClick={() => onOpenMutation('create-app-version')}
                variant="orange"
                iconBg={`${theme.brandOrange}1A`}
                iconColor={theme.brandOrange}
                hoverBorderColor={theme.brandOrange}
              />
            </div>
          </div>
        </>
      )}

      {/* Undelete button when deleted */}
      {registryDeleted && (
        <ActionButton
          icon={RotateCcw}
          title="Undelete App"
          description="Restore this app to active status"
          onClick={handleUndelete}
          isLoading={isLoading}
          variant="success"
        />
      )}
    </div>
  );
}
