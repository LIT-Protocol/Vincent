import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { CreateAbilityForm, type CreateAbilityFormData } from '../forms/CreateAbilityForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';

export function CreateAbilityWrapper() {
  // Mutation
  const [createAbility, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useCreateAbilityMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data) {
      navigateWithDelay(navigate, `/developer/ability/${encodeURIComponent(data.packageName)}`); // Need to encodeURIComponent because packageName can contain special characters
    }
  }, [isSuccess, data, navigate]);

  // Loading states
  if (isLoading) {
    return <StatusMessage message="Creating ability..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Ability created successfully!" type="success" />;
  }

  // Error states
  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to create ability');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: CreateAbilityFormData) => {
    const { packageName, ...abilityCreateData } = data;

    await createAbility({
      packageName,
      abilityCreate: { ...abilityCreateData },
    });
  };

  // Render pure form component
  return <CreateAbilityForm onSubmit={handleSubmit} isSubmitting={isLoading} />;
}
