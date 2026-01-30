import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';

import { useWagmiSigner } from '@/hooks/developer-dashboard/useWagmiSigner';
import { useEnsureChain } from '@/hooks/developer-dashboard/useEnsureChain';
import { useOnChainAppOwnership } from '@/hooks/developer-dashboard/app/useOnChainAppOwnership';
import { AppDetailsView } from '../views/AppDetailsView';
import { EditAppForm } from '../forms/EditAppForm';
import { DeleteAppForm } from '../forms/DeleteAppForm';
import { ManageDelegateesForm } from '../forms/ManageDelegateesForm';
import { SetActiveVersionForm } from '../forms/SetActiveVersionForm';
import { CreateAppForm, CreateAppFormData, CreateAppWithIdFormData } from '../forms/CreateAppForm';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { useBlockchainAppData } from '@/hooks/useBlockchainAppData';
import { Breadcrumb } from '@/components/shared/ui/Breadcrumb';
import { EditAppFormData } from '../forms/EditAppForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shared/ui/dialog';
import { theme, fonts } from '@/lib/themeClasses';

type ViewType =
  | 'details'
  | 'edit-app'
  | 'edit-published-app'
  | 'delete-app'
  | 'manage-delegatees'
  | 'set-active-version';

export function AppOverviewWrapper() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentView, setCurrentView] = useState<ViewType>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getSigner } = useWagmiSigner();
  const { ensureChain, infoMessage } = useEnsureChain();

  // Define handlers early so they're available in early returns
  const handleCloseModal = () => {
    setCurrentView('details');
  };

  // Check on-chain ownership first (source of truth)
  const {
    isOwner,
    existsOnChain,
    isChecking: ownershipChecking,
    error: ownershipError,
  } = useOnChainAppOwnership(Number(appId));

  const { data: app, isLoading: appLoading } = vincentApiClient.useGetAppQuery(
    { appId: Number(appId) },
    { skip: !existsOnChain },
  );

  // Fetching on-chain data
  const {
    blockchainAppData,
    blockchainAppError,
    blockchainAppLoading,
    refetch: refetchBlockchainData,
  } = useBlockchainAppData(Number(appId));

  // Mutations
  const [editApp] = vincentApiClient.useEditAppMutation();
  const [createApp] = vincentApiClient.useCreateAppMutation();

  // Check for action query param when data is ready
  useEffect(() => {
    if (!app || appLoading || blockchainAppLoading) {
      return;
    }

    const action = searchParams.get('action');

    if (action) {
      setCurrentView(action as ViewType);

      // Clear the query param immediately
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams, app, appLoading, blockchainAppLoading]);

  // Check on-chain ownership first
  if (ownershipChecking) return <Loading />;

  if (ownershipError) {
    return <StatusMessage message="Failed to check app ownership on-chain" type="error" />;
  }

  // App doesn't exist on-chain
  if (existsOnChain === false) {
    return (
      <>
        <Breadcrumb items={[{ label: 'Apps', onClick: () => navigate('/developer/apps') }]} />
        <StatusMessage message="This app does not exist on the blockchain" type="error" />
      </>
    );
  }

  // User doesn't own the app on-chain
  if (isOwner === false) {
    return (
      <>
        <Breadcrumb items={[{ label: 'Apps', onClick: () => navigate('/developer/apps') }]} />
        <StatusMessage message="You do not have permission to manage this app" type="error" />
      </>
    );
  }

  // App exists on-chain and user owns it, but not in registry yet
  // Show recovery form to allow user to sync their app to the registry
  if (existsOnChain && isOwner && !app && !appLoading) {
    const handleSyncToRegistry = async (data: CreateAppFormData | CreateAppWithIdFormData) => {
      await createApp({
        appCreate: {
          appId: Number(appId),
          name: data.name,
          description: data.description,
          contactEmail: data.contactEmail,
          appUrl: data.appUrl,
          logo: data.logo,
          deploymentStatus: data.deploymentStatus,
        },
      }).unwrap();
    };

    const handleSyncSuccess = () => {
      // Reload the page to show the app details
      window.location.reload();
    };

    return (
      <>
        <Breadcrumb
          items={[
            { label: 'Apps', onClick: () => navigate('/developer/apps') },
            { label: `App ${appId}` },
          ]}
        />
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className={`text-2xl font-semibold ${theme.text}`} style={fonts.heading}>
              Complete App Registration
            </h1>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
              WIP
            </span>
          </div>
          <p className={`${theme.textMuted} text-sm mb-3`} style={fonts.body}>
            Your app (ID: {appId}) was registered on-chain but needs to be synced to the Vincent
            Registry. Please fill in the app details below to complete the registration.
          </p>
          <p className={`text-sm text-yellow-600 dark:text-yellow-400`} style={fonts.body}>
            <strong>Note:</strong> This will only sync app metadata. Version abilities cannot be
            automatically synced for on-chain versions. Please{' '}
            <a
              href="https://discord.com/invite/zBw5hDZve8"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline font-medium"
              style={{ color: theme.brandOrange }}
            >
              contact our team
            </a>{' '}
            for assistance with syncing abilities.
          </p>
        </div>
        <CreateAppForm
          existingAppId={Number(appId)}
          onSubmit={handleSyncToRegistry}
          onSuccess={handleSyncSuccess}
          isSubmitting={isSubmitting}
        />
      </>
    );
  }

  // If app data is still loading, show loading
  if (appLoading || blockchainAppLoading) {
    return <Loading />;
  }

  // Handle errors only if app should exist but failed to load (not 404)
  // 404 is handled above in the "create-in-registry" flow
  if (app && blockchainAppError) {
    return <StatusMessage message="Failed to load on-chain app data" type="error" />;
  }

  // If we reach here without app data, something unexpected happened
  if (!app) {
    return <Loading />;
  }

  const handleOpenMutation = (mutationType: string) => {
    if (mutationType === 'versions') {
      navigate(`/developer/apps/appId/${appId}/versions`);
    } else if (mutationType === 'create-app-version') {
      navigate(`/developer/apps/appId/${appId}/new-version`);
    } else {
      setCurrentView(mutationType as ViewType);
    }
  };

  const handleEditAppSubmit = async (data: EditAppFormData) => {
    setIsSubmitting(true);
    try {
      await editApp({
        appId: Number(appId),
        appEdit: data,
      }).unwrap();

      // Success - wait a moment to show success message, then close modal
      setTimeout(() => {
        setCurrentView('details');
        setIsSubmitting(false);
      }, 1500);
    } catch (error) {
      // Error is handled by the form's error state
      console.error('Failed to update app:', error);
      setIsSubmitting(false);
      throw error; // Re-throw to let the form handle it
    }
  };

  const handleDeleteAppSubmit = async () => {
    // Ensure user is on Base Sepolia before starting
    const canProceed = await ensureChain('Delete App');
    if (!canProceed) return; // Chain was switched, user needs to click again

    setIsSubmitting(true);
    try {
      // Delete on-chain only - on-chain is the source of truth
      const signer = await getSigner();
      const client = getClient({ signer });

      await client.deleteApp({
        appId: Number(appId),
      });

      // Success - navigate back to apps list
      navigate('/developer/apps');
    } catch (error: any) {
      console.error('Failed to delete app:', error);
      setIsSubmitting(false);
      throw error;
    }
  };

  return (
    <>
      <Breadcrumb
        items={[{ label: 'Apps', onClick: () => navigate('/developer/apps') }, { label: app.name }]}
      />
      <AppDetailsView
        selectedApp={app}
        onOpenMutation={handleOpenMutation}
        blockchainAppData={blockchainAppData}
        blockchainAppLoading={blockchainAppLoading}
        refetchBlockchainData={refetchBlockchainData}
      />

      {/* Edit App Modal */}
      <Dialog
        open={currentView === 'edit-app' || currentView === 'edit-published-app'}
        onOpenChange={handleCloseModal}
      >
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold" style={fonts.heading}>
              Edit App
            </DialogTitle>
          </DialogHeader>
          <EditAppForm appData={app} onSubmit={handleEditAppSubmit} isSubmitting={isSubmitting} />
        </DialogContent>
      </Dialog>

      {/* Delete App Modal */}
      <Dialog open={currentView === 'delete-app'} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold" style={fonts.heading}>
              Delete App
            </DialogTitle>
          </DialogHeader>
          {infoMessage && (
            <div className="mb-4">
              <StatusMessage message={infoMessage} type="info" />
            </div>
          )}
          <DeleteAppForm
            appName={app.name}
            onSubmit={handleDeleteAppSubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Manage Delegatees Modal */}
      <Dialog open={currentView === 'manage-delegatees'} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold" style={fonts.heading}>
              Manage Delegatees
            </DialogTitle>
          </DialogHeader>
          <ManageDelegateesForm existingDelegatees={blockchainAppData?.delegateeAddresses || []} />
        </DialogContent>
      </Dialog>

      {/* Set Active Version Modal */}
      <Dialog open={currentView === 'set-active-version'} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold" style={fonts.heading}>
              Set Active Version
            </DialogTitle>
          </DialogHeader>
          <SetActiveVersionForm
            currentActiveVersion={app.activeVersion}
            onSuccess={handleCloseModal}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
