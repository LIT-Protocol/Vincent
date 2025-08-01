import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DeleteAbilityVersionForm,
  DeleteAbilityVersionFormData,
} from '../forms/DeleteAbilityVersionForm';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/shared/ui/Loading';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';

export function DeleteAbilityVersionWrapper() {
  const { packageName, version } = useParams<{ packageName: string; version: string }>();

  // Fetching
  const {
    data: ability,
    isLoading: abilityLoading,
    isError: abilityError,
  } = vincentApiClient.useGetAbilityQuery({ packageName: packageName || '' });

  const {
    data: versionsData,
    isLoading: versionLoading,
    isError: versionError,
  } = vincentApiClient.useGetAbilityVersionsQuery({ packageName: packageName || '' });

  // Mutation
  const [deleteAbilityVersion, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useDeleteAbilityVersionMutation();

  const [
    editAbility,
    {
      isLoading: editAbilityLoading,
      isSuccess: editAbilitySuccess,
      isError: isEditAbilityError,
      data: editAbilityData,
      error: editAbilityError,
    },
  ] = vincentApiClient.useEditAbilityMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data) {
      navigate(`/developer/ability/${encodeURIComponent(packageName!)}/versions`); // Navigate immediately, no delay needed
    }
  }, [isSuccess, data, navigate]);

  // Loading states
  if (abilityLoading || versionLoading) return <Loading />;

  // Error states
  if (abilityError) return <StatusMessage message="Failed to load ability" type="error" />;
  if (versionError) return <StatusMessage message="Failed to load ability version" type="error" />;
  if (!ability) return <StatusMessage message={`Ability ${packageName} not found`} type="error" />;
  if (!versionsData)
    return <StatusMessage message={`Ability version ${version} not found`} type="error" />;

  // Mutation states
  if (isLoading || editAbilityLoading) {
    return <StatusMessage message="Deleting ability..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Ability deleted successfully!" type="success" />;
  }

  if (editAbilitySuccess && editAbilityData) {
    return <StatusMessage message="Active version updated successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to delete ability');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  if (isEditAbilityError && editAbilityError) {
    const errorMessage = getErrorMessage(editAbilityError, 'Failed to update active version');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (formData: DeleteAbilityVersionFormData) => {
    if (ability.activeVersion === version && formData.activeVersion) {
      await editAbility({
        packageName: ability.packageName,
        abilityEdit: {
          activeVersion: formData.activeVersion,
        },
      });
    }
    await deleteAbilityVersion({ packageName: ability.packageName, version: version || '' });
  };
  return (
    <div className="space-y-6">
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Delete Ability Version</h1>
            <p className="text-gray-600 mt-2">
              Delete "{ability.title}" version {version}. This action can be undone.
            </p>
          </div>
        </div>
      </div>

      <DeleteAbilityVersionForm
        ability={ability}
        version={version || ''}
        versions={versionsData}
        onSubmit={handleSubmit}
        isSubmitting={isLoading}
      />
    </div>
  );
}
