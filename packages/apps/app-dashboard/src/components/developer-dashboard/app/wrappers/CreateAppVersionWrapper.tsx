import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { CreateAppVersionForm, type CreateAppVersionFormData } from '../forms/CreateAppVersionForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/shared/ui/Loading';

export function CreateAppVersionWrapper() {
  const { appId } = useParams<{ appId: string }>();

  // Fetching
  const {
    data: app,
    isLoading: appLoading,
    isError: appError,
  } = vincentApiClient.useGetAppQuery({ appId: Number(appId) });

  const { isLoading: versionsLoading, isError: versionsError } =
    vincentApiClient.useGetAppVersionsQuery({ appId: Number(appId) });

  // Mutation
  const [createAppVersion, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useCreateAppVersionMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data && app) {
      navigateWithDelay(navigate, `/developer/appId/${app.appId}/version/${data.version}/tools`);
    }
  }, [isSuccess, data, navigate, app]);

  // Loading states
  if (appLoading || versionsLoading) return <Loading />;

  // Error states
  if (appError) return <StatusMessage message="Failed to load app" type="error" />;
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
