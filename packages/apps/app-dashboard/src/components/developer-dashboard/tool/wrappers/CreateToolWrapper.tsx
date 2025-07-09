import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { CreateToolForm, type CreateToolFormData } from '../forms/CreateToolForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';

export function CreateToolWrapper() {
  // Mutation
  const [createTool, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useCreateToolMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data) {
      navigateWithDelay(navigate, `/developer/toolId/${encodeURIComponent(data.packageName)}`); // Need to encodeURIComponent because packageName can contain special characters
    }
  }, [isSuccess, data, navigate]);

  // Loading states
  if (isLoading) {
    return <StatusMessage message="Creating tool..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Tool created successfully!" type="success" />;
  }

  // Error states
  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to create tool');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: CreateToolFormData) => {
    const { packageName, ...toolCreateData } = data;

    await createTool({
      packageName,
      toolCreate: { ...toolCreateData },
    });
  };

  // Render pure form component
  return <CreateToolForm onSubmit={handleSubmit} isSubmitting={isLoading} />;
}
