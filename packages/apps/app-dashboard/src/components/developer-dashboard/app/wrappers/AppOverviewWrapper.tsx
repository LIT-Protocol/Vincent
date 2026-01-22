import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';

import { useWagmiSigner } from '@/hooks/developer-dashboard/useWagmiSigner';
import { useOnChainAppOwnership } from '@/hooks/developer-dashboard/app/useOnChainAppOwnership';
import { AppDetailsView } from '../views/AppDetailsView';
import { EditAppForm } from '../forms/EditAppForm';
import { DeleteAppForm } from '../forms/DeleteAppForm';
import { ManageDelegateesForm } from '../forms/ManageDelegateesForm';
import { CreateAppForm } from '../forms/CreateAppForm';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { useBlockchainAppData } from '@/hooks/useBlockchainAppData';
import { Breadcrumb } from '@/components/shared/ui/Breadcrumb';
import { EditAppFormData } from '../forms/EditAppForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
import { theme, fonts } from '@/lib/themeClasses';

type ViewType =
  | 'details'
  | 'edit-app'
  | 'edit-published-app'
  | 'delete-app'
  | 'manage-delegatees'
  | 'create-in-registry';

export function AppOverviewWrapper() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentView, setCurrentView] = useState<ViewType>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getSigner } = useWagmiSigner();

  // Define handlers early so they're available in early returns
  const handleCloseModal = () => {
    setCurrentView('details');
  };

  // Check on-chain ownership first (source of truth)
  const {
    isOwner,
    existsOnChain,
    onChainApp,
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
  // Handle both: no app data (!app) OR 404 error (appError)
  if (existsOnChain && isOwner && !app && !appLoading) {
    return (
      <>
        <Breadcrumb
          items={[
            { label: 'Apps', onClick: () => navigate('/developer/apps') },
            { label: `App ${appId}` },
          ]}
        />
        <div className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl p-6 sm:p-8`}>
          <div className="max-w-2xl mx-auto text-center">
            {/* Success Icon */}
            <div className="mb-4 flex justify-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${theme.brandOrange}20` }}
              >
                <svg
                  className="w-6 h-6"
                  style={{ color: theme.brandOrange }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className={`text-lg font-semibold mb-3 ${theme.text}`} style={fonts.heading}>
              Add Your App to the Registry
            </h2>

            {/* Description */}
            <p className={`${theme.textMuted} text-sm mb-6 leading-relaxed`} style={fonts.body}>
              Your app is successfully registered on-chain! The next step is to add it to the
              Vincent Registry, which makes your app discoverable by users. The registry stores
              metadata like your app's name, description, logo, and contact information, making it
              easy for users to find and connect with your app.
            </p>

            {/* CTA Button */}
            <button
              onClick={() => setCurrentView('create-in-registry')}
              className="px-6 py-2.5 text-white rounded-lg font-semibold transition-all hover:scale-105"
              style={{ backgroundColor: theme.brandOrange, ...fonts.heading }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.brandOrangeDarker;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.brandOrange;
              }}
            >
              Add App to Registry
            </button>
          </div>
        </div>

        {/* Create in Registry Modal - must be included here since we return early */}
        <Dialog open={currentView === 'create-in-registry'} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold" style={fonts.heading}>
                Add App to Registry
              </DialogTitle>
              <DialogDescription>
                This app exists on-chain (ID: {appId}) but hasn't been added to the registry yet.
                Fill in the details below to make it visible in the registry.
              </DialogDescription>
            </DialogHeader>
            {onChainApp && (
              <CreateAppForm
                existingAppId={Number(appId)}
                isSubmitting={isSubmitting}
                onSubmit={async (data) => {
                  setIsSubmitting(true);
                  try {
                    await createApp({
                      appCreate: { ...data, appId: Number(appId) },
                    }).unwrap();

                    // Success - wait a moment to show success message, then reload
                    setTimeout(() => {
                      window.location.reload(); // Reload to fetch the new registry data
                    }, 1500);
                  } catch (error) {
                    console.error('Failed to create app in registry:', error);
                    setIsSubmitting(false);
                    throw error; // Re-throw to let the form handle it
                  }
                }}
              />
            )}
          </DialogContent>
        </Dialog>
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
          <ManageDelegateesForm
            existingDelegatees={blockchainAppData?.delegateeAddresses || []}
            refetchBlockchainData={refetchBlockchainData}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
