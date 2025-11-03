import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreatePolicyForm, type CreatePolicyFormData } from '../forms/CreatePolicyForm';
import { navigateWithDelay } from '@/utils/developer-dashboard/app-forms';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { Breadcrumb } from '@/components/shared/ui/Breadcrumb';

export function CreatePolicyWrapper() {
  // Mutation
  const [createPolicy, { isLoading, isSuccess, data }] = vincentApiClient.useCreatePolicyMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data) {
      navigateWithDelay(
        navigate,
        `/developer/policies/policy/${encodeURIComponent(data.packageName)}`,
      ); // Need to encodeURIComponent because packageName can contain special characters
    }
  }, [isSuccess, data, navigate]);

  const handleSubmit = async (data: CreatePolicyFormData) => {
    const { packageName, ...policyCreateData } = data;

    await createPolicy({
      packageName,
      policyCreate: { ...policyCreateData },
    }).unwrap();
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Policies', onClick: () => navigate('/developer/policies') },
          { label: 'Create Policy' },
        ]}
      />
      <CreatePolicyForm onSubmit={handleSubmit} isSubmitting={isLoading} />
    </>
  );
}
