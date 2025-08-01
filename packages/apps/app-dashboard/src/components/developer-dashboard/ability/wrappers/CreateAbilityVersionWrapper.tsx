import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import {
  CreateAbilityVersionForm,
  type CreateAbilityVersionFormData,
} from '../forms/CreateAbilityVersionForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/shared/ui/Loading';

export function CreateAbilityVersionWrapper() {
  const { packageName } = useParams<{ packageName: string }>();

  // Fetching
  const {
    data: ability,
    isLoading: abilityLoading,
    isError: abilityError,
  } = vincentApiClient.useGetAbilityQuery({ packageName: packageName || '' });

  // Mutation
  const [createAbilityVersion, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useCreateAbilityVersionMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data && ability) {
      navigateWithDelay(
        navigate,
        `/developer/ability/${encodeURIComponent(ability.packageName)}/version/${data.version}`,
      );
    }
  }, [isSuccess, data, navigate, ability]);

  // Loading states
  if (abilityLoading) return <Loading />;

  // Error states
  if (abilityError) return <StatusMessage message="Failed to load ability" type="error" />;
  if (!ability) return <StatusMessage message={`Ability ${packageName} not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Creating ability version..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Ability version created successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to create ability version');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: CreateAbilityVersionFormData) => {
    await createAbilityVersion({
      packageName: ability.packageName,
      version: data.version,
      abilityVersionCreate: {
        changes: data.changes,
      },
    });
  };

  // Render with page UI and form component
  return (
    <div className="space-y-6">
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Create New Version</h1>
            <p className="text-gray-600 mt-2">
              Create a new version of your ability with updated features
            </p>
          </div>
        </div>
      </div>

      <CreateAbilityVersionForm
        ability={ability}
        onSubmit={handleSubmit}
        isSubmitting={isLoading}
      />
    </div>
  );
}
