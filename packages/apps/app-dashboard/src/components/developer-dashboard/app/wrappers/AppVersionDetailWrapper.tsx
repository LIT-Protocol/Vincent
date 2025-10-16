import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';

import { StatusMessage } from '@/components/shared/ui/statusMessage';
import Loading from '@/components/shared/ui/Loading';
import { AppVersionDetailView } from '@/components/developer-dashboard/app/views/AppVersionDetailView';
import { useBlockchainAppData } from '@/hooks/useBlockchainAppData';
import { useBlockchainAppVersionData } from '@/hooks/useBlockchainAppVersionData';
import { Breadcrumb } from '@/components/shared/ui/Breadcrumb';
import { EditAppVersionForm, type EditAppVersionFormData } from '../forms/EditAppVersionForm';
import { DeleteAppVersionForm, type DeleteAppVersionFormData } from '../forms/DeleteAppVersionForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
import { fonts } from '@/components/user-dashboard/connect/ui/theme';

type ViewType = 'details' | 'edit-version' | 'delete-version';

export function AppVersionDetailWrapper() {
  const { appId, versionId } = useParams<{ appId: string; versionId: string }>();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<ViewType>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch app data from API
  const {
    data: app,
    isLoading: appLoading,
    isError: appError,
  } = vincentApiClient.useGetAppQuery({ appId: Number(appId) });

  // Fetch app versions from API
  const {
    data: appVersions,
    isLoading: versionsLoading,
    isError: versionsError,
  } = vincentApiClient.useGetAppVersionsQuery({ appId: Number(appId) });

  // Fetch specific version data from API
  const {
    data: versionData,
    isLoading: versionLoading,
    isError: versionError,
  } = vincentApiClient.useGetAppVersionQuery({ appId: Number(appId), version: Number(versionId) });

  // Fetch version abilities from API
  const {
    data: versionAbilities,
    isLoading: versionAbilitiesLoading,
    isError: versionAbilitiesError,
  } = vincentApiClient.useListAppVersionAbilitiesQuery({
    appId: Number(appId),
    version: Number(versionId),
  });

  const { blockchainAppData, blockchainAppError, blockchainAppLoading } = useBlockchainAppData(
    Number(appId),
  );

  // Fetch blockchain app and version data
  const {
    blockchainAppVersion,
    blockchainAppVersionError,
    blockchainAppVersionLoading,
    refetch: refetchBlockchainAppVersionData,
  } = useBlockchainAppVersionData(Number(appId), Number(versionId));

  // Mutations
  const [editAppVersion] = vincentApiClient.useEditAppVersionMutation();
  const [deleteAppVersion] = vincentApiClient.useDeleteAppVersionMutation();
  const [editApp] = vincentApiClient.useEditAppMutation();

  // Loading states first
  if (
    appLoading ||
    versionsLoading ||
    versionLoading ||
    versionAbilitiesLoading ||
    blockchainAppLoading ||
    blockchainAppVersionLoading
  )
    return <Loading />;

  // Combined error states
  if (appError) return <StatusMessage message="Failed to load app" type="error" />;
  if (versionsError) return <StatusMessage message="Failed to load app versions" type="error" />;
  if (blockchainAppError)
    return <StatusMessage message="Failed to load on-chain app data" type="error" />;
  if (blockchainAppVersionError)
    return <StatusMessage message="Failed to load on-chain app version data" type="error" />;
  if (versionError) return <StatusMessage message="Failed to load version data" type="error" />;
  if (versionAbilitiesError)
    return <StatusMessage message="Failed to load version abilities" type="error" />;
  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;
  if (!versionData)
    return <StatusMessage message={`Version ${versionId} not found`} type="error" />;

  const handleOpenMutation = (mutationType: string) => {
    setCurrentView(mutationType as ViewType);
  };

  const handleEditAppVersionSubmit = async (data: EditAppVersionFormData) => {
    setIsSubmitting(true);
    try {
      await editAppVersion({
        appId: Number(appId),
        version: Number(versionId),
        appVersionEdit: data,
      }).unwrap();

      // Success - wait a moment to show success message, then close modal
      setTimeout(() => {
        setCurrentView('details');
        setIsSubmitting(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to update app version:', error);
      setIsSubmitting(false);
      throw error;
    }
  };

  const handleDeleteAppVersionSubmit = async (formData: DeleteAppVersionFormData) => {
    setIsSubmitting(true);
    try {
      if (app.activeVersion === Number(versionId) && formData.activeVersion) {
        await editApp({
          appId: app.appId,
          appEdit: {
            activeVersion: formData.activeVersion,
          },
        }).unwrap();
      }
      await deleteAppVersion({ appId: app.appId, version: Number(versionId) }).unwrap();

      // Success - navigate back to versions list
      navigate(`/developer/apps/appId/${appId}/versions`);
    } catch (error) {
      console.error('Failed to delete app version:', error);
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
        items={[
          { label: 'Apps', onClick: () => navigate('/developer/apps') },
          { label: app.name, onClick: () => navigate(`/developer/apps/appId/${appId}`) },
          { label: 'Versions', onClick: () => navigate(`/developer/apps/appId/${appId}/versions`) },
          { label: `Version ${versionId}` },
        ]}
      />
      <AppVersionDetailView
        app={app}
        versionData={versionData}
        versionAbilities={versionAbilities || []}
        blockchainAppVersion={blockchainAppVersion}
        blockchainAppData={blockchainAppData}
        refetchBlockchainAppVersionData={refetchBlockchainAppVersionData}
        onOpenMutation={handleOpenMutation}
      />

      {/* Edit Version Modal */}
      <Dialog open={currentView === 'edit-version'} onOpenChange={handleCloseModal}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold" style={fonts.heading}>
              Edit Version
            </DialogTitle>
            <DialogDescription>Update the changes description for this version</DialogDescription>
          </DialogHeader>
          <EditAppVersionForm
            versionData={versionData}
            onSubmit={handleEditAppVersionSubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Version Modal */}
      <Dialog open={currentView === 'delete-version'} onOpenChange={handleCloseModal}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold" style={fonts.heading}>
              Delete Version
            </DialogTitle>
          </DialogHeader>
          <DeleteAppVersionForm
            app={app}
            version={Number(versionId)}
            versions={appVersions || []}
            onSubmit={handleDeleteAppVersionSubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
