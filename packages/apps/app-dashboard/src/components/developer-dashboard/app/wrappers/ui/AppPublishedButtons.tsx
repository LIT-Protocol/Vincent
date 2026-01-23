import { useState, useEffect } from 'react';
import { Plus, Users, Trash2, Edit, RotateCcw, List, CheckCircle } from 'lucide-react';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { App } from '@/types/developer-dashboard/appTypes';
import { App as ContractApp } from '@lit-protocol/vincent-contracts-sdk';
import MutationButtonStates from '@/components/shared/ui/MutationButtonStates';
import { useWagmiSigner } from '@/hooks/developer-dashboard/useWagmiSigner';
import { useEnsureChain } from '@/hooks/developer-dashboard/useEnsureChain';
import { theme, fonts } from '@/lib/themeClasses';
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
  const { getSigner } = useWagmiSigner();
  const { ensureChain } = useEnsureChain();

  // On-chain is the source of truth for deleted state
  const isDeleted = appBlockchainData.isDeleted;

  // Handler for app undelete (on-chain only)
  const handleUndelete = async () => {
    // Ensure user is on Base Sepolia before starting
    try {
      const canProceed = await ensureChain('Undelete App');
      if (!canProceed) return; // Chain was switched, user needs to click again
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch network');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const signer = await getSigner();
      const client = getClient({ signer });

      await client.undeleteApp({
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

  if (error) {
    return <MutationButtonStates type="error" errorMessage={error} />;
  }

  if (success) {
    return <MutationButtonStates type="success" successMessage={success} />;
  }

  // Show regular buttons when not deleted
  if (!isDeleted) {
    return (
      <div className="space-y-6">
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
              description="Remove this app (this can be undone)."
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              description="Create a new version with abilities"
              onClick={() => onOpenMutation('create-app-version')}
              variant="orange"
              iconBg={`${theme.brandOrange}1A`}
              iconColor={theme.brandOrange}
              hoverBorderColor={theme.brandOrange}
            />

            <ActionButton
              icon={CheckCircle}
              title="Set Active Version"
              description="Choose which version users see"
              onClick={() => onOpenMutation('set-active-version')}
              variant="orange"
              iconBg={`${theme.brandOrange}1A`}
              iconColor={theme.brandOrange}
              hoverBorderColor={theme.brandOrange}
            />
          </div>
        </div>
      </div>
    );
  }

  // Show undelete button when deleted
  return (
    <ActionButton
      icon={RotateCcw}
      title="Undelete App"
      description="Restore this app to active status"
      onClick={handleUndelete}
      isLoading={isProcessing}
      variant="success"
    />
  );
}
