import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import {
  EditAbilityVersionForm,
  type EditAbilityVersionFormData,
} from '../forms/EditAbilityVersionForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/shared/ui/Loading';

export function EditAbilityVersionWrapper() {
  const { packageName, version } = useParams<{ packageName: string; version: string }>();

  // Fetching
  const {
    data: ability,
    isLoading: abilityLoading,
    isError: abilityError,
  } = vincentApiClient.useGetAbilityQuery({ packageName: packageName || '' });

  const {
    data: versionData,
    isLoading: versionLoading,
    isError: versionError,
  } = vincentApiClient.useGetAbilityVersionQuery({
    packageName: packageName || '',
    version: version || '',
  });

  // Mutation
  const [editAbilityVersion, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useEditAbilityVersionMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data && ability && versionData) {
      navigateWithDelay(
        navigate,
        `/developer/ability/${encodeURIComponent(ability.packageName)}/version/${versionData.version}`,
      );
    }
  }, [isSuccess, data, navigate, ability, versionData]);

  // Loading states
  if (abilityLoading || versionLoading) return <Loading />;

  // Error states
  if (abilityError) return <StatusMessage message="Failed to load ability" type="error" />;
  if (versionError) return <StatusMessage message="Failed to load version data" type="error" />;
  if (!ability) return <StatusMessage message={`Ability ${packageName} not found`} type="error" />;
  if (!versionData) return <StatusMessage message={`Version ${version} not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Updating ability version..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Ability version updated successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to update ability version');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: EditAbilityVersionFormData) => {
    await editAbilityVersion({
      packageName: ability.packageName,
      version: versionData.version,
      abilityVersionEdit: data,
    });
  };

  // Render with page UI and form component
  return (
    <div className="space-y-6">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              Edit {ability.packageName} - Version {versionData.version}
            </h1>
            <p className="text-gray-600 mt-2">
              Update the settings and configuration for this version
            </p>
          </div>
        </div>
      </div>

      <EditAbilityVersionForm
        versionData={versionData}
        onSubmit={handleSubmit}
        isSubmitting={isLoading}
      />
    </div>
  );
}
