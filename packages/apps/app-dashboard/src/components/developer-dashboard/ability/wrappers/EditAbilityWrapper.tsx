import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { EditAbilityForm, type EditAbilityFormData } from '../forms/EditAbilityForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/shared/ui/Loading';

export function EditAbilityWrapper() {
  const { packageName } = useParams<{ packageName: string }>();

  // Fetching
  const {
    data: ability,
    isLoading: abilityLoading,
    isError: abilityError,
  } = vincentApiClient.useGetAbilityQuery({ packageName: packageName || '' });

  const {
    data: abilityVersions,
    isLoading: versionsLoading,
    isError: versionsError,
  } = vincentApiClient.useGetAbilityVersionsQuery({ packageName: packageName || '' });

  // Mutation
  const [editAbility, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useEditAbilityMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data && ability) {
      navigateWithDelay(navigate, `/developer/ability/${encodeURIComponent(ability.packageName)}`);
    }
  }, [isSuccess, data, ability]);

  // Loading states
  if (abilityLoading || versionsLoading) return <Loading />;

  // Error states
  if (abilityError) return <StatusMessage message="Failed to load ability" type="error" />;
  if (versionsError)
    return <StatusMessage message="Failed to load ability versions" type="error" />;
  if (!ability) return <StatusMessage message={`Ability ${packageName} not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Updating ability..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Ability updated successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to update ability');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: EditAbilityFormData) => {
    const { packageName, ...abilityEditData } = data;

    await editAbility({
      packageName,
      abilityEdit: { ...abilityEditData },
    });
  };

  // Render with page UI and form component
  return (
    <div className="space-y-6">
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Edit {ability.packageName}</h1>
            <p className="text-gray-600 mt-2">Update your ability settings and configuration</p>
          </div>
        </div>
      </div>

      <EditAbilityForm
        abilityData={ability}
        abilityVersions={abilityVersions || []}
        onSubmit={handleSubmit}
        isSubmitting={isLoading}
      />
    </div>
  );
}
