import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { CreateAbilityForm, type CreateAbilityFormData } from '../forms/CreateAbilityForm';
import { navigateWithDelay } from '@/utils/developer-dashboard/app-forms';
import { Breadcrumb } from '@/components/shared/ui/Breadcrumb';

export function CreateAbilityWrapper() {
  // Mutation
  const [createAbility, { isLoading, isSuccess, data }] =
    vincentApiClient.useCreateAbilityMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data) {
      navigateWithDelay(
        navigate,
        `/developer/abilities/ability/${encodeURIComponent(data.packageName)}`,
      ); // Need to encodeURIComponent because packageName can contain special characters
    }
  }, [isSuccess, data, navigate]);

  const handleSubmit = async (data: CreateAbilityFormData) => {
    const { packageName, ...abilityCreateData } = data;

    await createAbility({
      packageName,
      abilityCreate: { ...abilityCreateData },
    }).unwrap();
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Abilities', onClick: () => navigate('/developer/abilities') },
          { label: 'Create Ability' },
        ]}
      />
      <CreateAbilityForm onSubmit={handleSubmit} isSubmitting={isLoading} />
    </>
  );
}
