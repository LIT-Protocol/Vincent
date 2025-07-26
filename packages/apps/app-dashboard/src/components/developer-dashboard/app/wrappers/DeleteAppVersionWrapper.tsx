import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DeleteAppVersionForm } from '../forms/DeleteAppVersionForm';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/shared/ui/Loading';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { DeleteAppVersionFormData } from '../forms/DeleteAppVersionForm';

export function DeleteAppVersionWrapper() {
  const { appId, versionId } = useParams<{ appId: string; versionId: string }>();

  // Fetching
  const {
    data: app,
    isLoading: appLoading,
    isError: appError,
  } = vincentApiClient.useGetAppQuery({ appId: Number(appId) });

  // Note: The data here is barely used, but we need to confirm the version exists with a query
  const {
    data: versionsData,
    isLoading: versionLoading,
    isError: versionError,
  } = vincentApiClient.useGetAppVersionsQuery({ appId: Number(appId) });

  // Mutation
  const [deleteAppVersion, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useDeleteAppVersionMutation();

  const [
    editApp,
    {
      isLoading: editAppLoading,
      isSuccess: editAppSuccess,
      isError: isEditAppError,
      data: editAppData,
      error: editAppError,
    },
  ] = vincentApiClient.useEditAppMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data) {
      navigate(`/developer/appId/${appId}/versions`); // Navigate immediately, no delay needed
    }
  }, [isSuccess, data, navigate]);

  // Loading states
  if (appLoading || versionLoading) return <Loading />;

  // Error states
  if (appError) return <StatusMessage message="Failed to load app" type="error" />;
  if (versionError) return <StatusMessage message="Failed to load app version" type="error" />;
  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;
  if (!versionsData)
    return <StatusMessage message={`App version ${versionId} not found`} type="error" />;

  // Mutation states
  if (isLoading || editAppLoading) {
    return <StatusMessage message="Deleting app..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="App deleted successfully!" type="success" />;
  }

  if (editAppSuccess && editAppData) {
    return <StatusMessage message="Active version updated successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to delete app');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  if (isEditAppError && editAppError) {
    const errorMessage = getErrorMessage(editAppError, 'Failed to update active version');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (formData: DeleteAppVersionFormData) => {
    if (app.activeVersion === Number(versionId) && formData.activeVersion) {
      await editApp({
        appId: app.appId,
        appEdit: {
          activeVersion: formData.activeVersion,
        },
      });
    }
    await deleteAppVersion({ appId: app.appId, version: Number(versionId) });
  };
  return (
    <div className="space-y-6">
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Delete App Version</h1>
            <p className="text-gray-600 mt-2">
              Delete "{app.name}" version {versionId}. This action can be undone.
            </p>
          </div>
        </div>
      </div>

      <DeleteAppVersionForm
        app={app}
        version={Number(versionId)}
        versions={versionsData}
        onSubmit={handleSubmit}
        isSubmitting={isLoading}
      />
    </div>
  );
}
