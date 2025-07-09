import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { CreatePolicyForm, type CreatePolicyFormData } from '../forms/CreatePolicyForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';

export function CreatePolicyWrapper() {
  // Fetching

  // Mutation
  const [createPolicy, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useCreatePolicyMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data) {
      navigateWithDelay(navigate, `/developer/policyId/${encodeURIComponent(data.packageName)}`); // Need to encodeURIComponent because packageName can contain special characters
    }
  }, [isSuccess, data, navigate]);

  // Loading states
  if (isLoading) {
    return <StatusMessage message="Creating policy..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Policy created successfully!" type="success" />;
  }

  // Error states
  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to create policy');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: CreatePolicyFormData) => {
    const { packageName, ...policyCreateData } = data;

    await createPolicy({
      packageName,
      policyCreate: { ...policyCreateData },
    });
  };

  // Render pure form component
  return <CreatePolicyForm onSubmit={handleSubmit} isSubmitting={isLoading} />;
}
