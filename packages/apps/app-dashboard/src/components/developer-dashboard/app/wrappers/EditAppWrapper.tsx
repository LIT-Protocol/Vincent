import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserApps } from '@/hooks/developer-dashboard/app/useUserApps';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { EditAppForm, type EditAppFormData } from '../forms/EditAppForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/layout/Loading';
import { sortAppFromApps } from '@/utils/developer-dashboard/sortAppFromApps';

export function EditAppWrapper() {
  const { appId } = useParams<{ appId: string }>();

  // Fetching
  const { data: apps, isLoading: appsLoading, isError: appsError } = useUserApps();

  const app = sortAppFromApps(apps, appId);

  const {
    data: appVersions,
    isLoading: versionsLoading,
    isError: versionsError,
  } = vincentApiClient.useGetAppVersionsQuery({ appId: Number(appId) });

  // Mutation
  const [editApp, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useEditAppMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data && app) {
      navigateWithDelay(navigate, `/developer/appId/${app.appId}`);
    }
  }, [isSuccess, data, app]);

  // Loading states
  if (appsLoading || versionsLoading) return <Loading />;

  // Error states
  if (appsError) return <StatusMessage message="Failed to load apps" type="error" />;
  if (versionsError) return <StatusMessage message="Failed to load app versions" type="error" />;
  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Updating app..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="App updated successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to update app');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: EditAppFormData) => {
    await editApp({
      appId: app.appId,
      appEdit: data,
    });
  };

  // Render with page UI and form component
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Edit {app.name}</h1>
          <p className="text-gray-600 mt-2">Update your application settings and configuration</p>
        </div>
      </div>

      <EditAppForm
        appData={app}
        appVersions={appVersions || []}
        onSubmit={handleSubmit}
        isSubmitting={isLoading}
      />
    </div>
  );
}
