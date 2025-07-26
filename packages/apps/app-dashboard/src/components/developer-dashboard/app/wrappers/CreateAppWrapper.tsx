import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { CreateAppForm, type CreateAppFormData } from '../forms/CreateAppForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';

export function CreateAppWrapper() {
  // Mutation
  const [createApp, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useCreateAppMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data) {
      navigateWithDelay(navigate, `/developer/appId/${data.appId}/version/1/tools`);
    }
  }, [isSuccess, data, navigate]);

  // Loading states
  if (isLoading) {
    return <StatusMessage message="Creating app..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="App created successfully!" type="success" />;
  }

  // Error states
  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to create app');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: CreateAppFormData) => {
    await createApp({
      appCreate: { ...data },
    });
  };

  // Render pure form component
  return <CreateAppForm onSubmit={handleSubmit} isSubmitting={isLoading} />;
}
