import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';

import { AppDetailsView } from '../views/AppDetailsView';
import { EditAppForm } from '../forms/EditAppForm';
import { CreateAppVersionForm } from '../forms/CreateAppVersionForm';
import { DeleteAppForm } from '../forms/DeleteAppForm';
import { ManageDelegateesForm } from '../forms/ManageDelegateesForm';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { useBlockchainAppData } from '@/hooks/useBlockchainAppData';
import { Breadcrumb } from '@/components/shared/ui/Breadcrumb';
import { EditAppFormData } from '../forms/EditAppForm';
import { CreateAppVersionFormData } from '../forms/CreateAppVersionForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
import { fonts } from '@/components/user-dashboard/connect/ui/theme';

type ViewType =
  | 'details'
  | 'edit-app'
  | 'edit-published-app'
  | 'create-app-version'
  | 'delete-app'
  | 'manage-delegatees';

export function AppOverviewWrapper() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentView, setCurrentView] = useState<ViewType>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: app,
    isLoading: appLoading,
    isError: appError,
  } = vincentApiClient.useGetAppQuery({ appId: Number(appId) });

  const {
    data: appVersions,
    isLoading: appVersionsLoading,
    isError: appVersionsError,
  } = vincentApiClient.useGetAppVersionsQuery({ appId: Number(appId) });

  // Fetching on-chain data
  const {
    blockchainAppData,
    blockchainAppError,
    blockchainAppLoading,
    refetch: refetchBlockchainData,
  } = useBlockchainAppData(Number(appId));

  // Mutations
  const [editApp] = vincentApiClient.useEditAppMutation();
  const [createAppVersion] = vincentApiClient.useCreateAppVersionMutation();
  const [deleteApp] = vincentApiClient.useDeleteAppMutation();

  // Check for action query param when data is ready
  useEffect(() => {
    if (!app || appLoading || appVersionsLoading || blockchainAppLoading) {
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
  }, [searchParams, setSearchParams, app, appLoading, appVersionsLoading, blockchainAppLoading]);

  const isLoadingEssentialData =
    appLoading || appVersionsLoading || blockchainAppLoading || !app || !appVersions;

  if (isLoadingEssentialData) return <Loading />;

  // Combined error states
  if (appError || blockchainAppError)
    return <StatusMessage message="Failed to load app" type="error" />;
  if (appVersionsError) return <StatusMessage message="Failed to load app versions" type="error" />;

  const handleOpenMutation = (mutationType: string) => {
    if (mutationType === 'versions') {
      navigate(`/developer/apps/appId/${appId}/versions`);
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

  const handleCreateAppVersionSubmit = async (data: CreateAppVersionFormData) => {
    setIsSubmitting(true);
    try {
      const result = await createAppVersion({
        appId: Number(appId),
        appVersionCreate: data,
      }).unwrap();

      // Success - wait a moment to show success message, then navigate to abilities page
      setTimeout(() => {
        navigate(`/developer/apps/appId/${appId}/version/${result.version}/abilities`);
        setIsSubmitting(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to create app version:', error);
      setIsSubmitting(false);
      throw error;
    }
  };

  const handleDeleteAppSubmit = async () => {
    setIsSubmitting(true);
    try {
      await deleteApp({ appId: Number(appId) }).unwrap();

      // Success - navigate back to apps list immediately
      navigate('/developer/apps');
    } catch (error) {
      console.error('Failed to delete app:', error);
      setIsSubmitting(false);
      throw error;
    }
  };

  const handleCloseModal = () => {
    setCurrentView('details');
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
              Edit
            </DialogTitle>
          </DialogHeader>
          <EditAppForm
            appData={app}
            appVersions={appVersions}
            onSubmit={handleEditAppSubmit}
            isSubmitting={isSubmitting}
            isPublished={blockchainAppData !== null}
          />
        </DialogContent>
      </Dialog>

      {/* Create App Version Modal */}
      <Dialog open={currentView === 'create-app-version'} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold" style={fonts.heading}>
              New Version
            </DialogTitle>
            <DialogDescription>Create a new version of your app</DialogDescription>
          </DialogHeader>
          <CreateAppVersionForm
            onSubmit={handleCreateAppVersionSubmit}
            isSubmitting={isSubmitting}
          />
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
