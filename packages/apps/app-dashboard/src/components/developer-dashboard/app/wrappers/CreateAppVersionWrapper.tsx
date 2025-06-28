import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useVincentApiWithSIWE } from '@/hooks/developer-dashboard/useVincentApiWithSIWE';
import { useUserApps } from '@/hooks/developer-dashboard/useUserApps';
import { useAddressCheck } from '@/hooks/developer-dashboard/app/useAddressCheck';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { CreateAppVersionForm, type CreateAppVersionFormData } from '../forms/CreateAppVersionForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/layout/Loading';

export function CreateAppVersionWrapper() {
  const { appId } = useParams<{ appId: string }>();
  const vincentApi = useVincentApiWithSIWE();

  // Fetching
  const { data: apps, isLoading: appsLoading, isError: appsError } = useUserApps();

  const app = useMemo(() => {
    return appId ? apps?.find((app) => app.appId === Number(appId)) || null : null;
  }, [apps, appId]);

  const {
    refetch: refetchVersions,
    isLoading: versionsLoading,
    isError: versionsError,
  } = vincentApiClient.useGetAppVersionsQuery({ appId: Number(appId) });

  // Mutation
  const [createAppVersion, { isLoading, isSuccess, isError, data, error }] =
    vincentApi.useCreateAppVersionMutation();

  // Navigation
  const navigate = useNavigate();

  useAddressCheck(app);

  // Effect
  useEffect(() => {
    if (isSuccess && data && app) {
      refetchVersions();
      navigateWithDelay(navigate, `/developer/appId/${app.appId}/version/${data.version}/tools`);
    }
  }, [isSuccess, data, refetchVersions, navigate, app]);

  // Loading states
  if (appsLoading || versionsLoading) return <Loading />;

  // Error states
  if (appsError) return <StatusMessage message="Failed to load apps" type="error" />;
  if (versionsError) return <StatusMessage message="Failed to load app versions" type="error" />;
  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Creating app version..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="App version created successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to create app version');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: CreateAppVersionFormData) => {
    await createAppVersion({
      appId: app.appId,
      appVersionCreate: data,
    });
  };

  // Render with page UI and form component
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Create New Version</h1>
          <p className="text-gray-600 mt-2">
            Create a new version of your application with updated features
          </p>
        </div>
      </div>

      <CreateAppVersionForm appData={app} onSubmit={handleSubmit} isSubmitting={isLoading} />
    </div>
  );
}
