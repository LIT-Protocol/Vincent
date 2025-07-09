import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAddressCheck } from '@/hooks/developer-dashboard/app/useAddressCheck';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { EditAppVersionForm, type EditAppVersionFormData } from '../forms/EditAppVersionForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/layout/Loading';

export function EditAppVersionWrapper() {
  const { appId, versionId } = useParams<{ appId: string; versionId: string }>();

  const {
    data: app,
    isLoading: appLoading,
    isError: appError,
  } = vincentApiClient.useGetAppQuery({ appId: Number(appId) });

  const {
    data: versionData,
    isLoading: versionLoading,
    isError: versionError,
  } = vincentApiClient.useGetAppVersionQuery({ appId: Number(appId), version: Number(versionId) });

  // Mutation
  const [editAppVersion, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useEditAppVersionMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data && app && versionData) {
      navigateWithDelay(navigate, `/developer/appId/${app.appId}/version/${versionData.version}`);
    }
  }, [isSuccess, data, navigate, app, versionData]);

  useAddressCheck(app || null);

  // Loading states
  if (appLoading || versionLoading) return <Loading />;

  // Error states
  if (appError) return <StatusMessage message="Failed to load app" type="error" />;
  if (versionError) return <StatusMessage message="Failed to load version data" type="error" />;
  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;
  if (!versionData)
    return <StatusMessage message={`Version ${versionId} not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Updating app version..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="App version updated successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to update app version');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: EditAppVersionFormData) => {
    await editAppVersion({
      appId: app.appId,
      version: versionData.version,
      appVersionEdit: data,
    });
  };

  // Render with page UI and form component
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            Edit {app.name} - Version {versionData.version}
          </h1>
          <p className="text-gray-600 mt-2">
            Update the settings and configuration for this version
          </p>
        </div>
      </div>

      <EditAppVersionForm
        versionData={versionData}
        onSubmit={handleSubmit}
        isSubmitting={isLoading}
      />
    </div>
  );
}
