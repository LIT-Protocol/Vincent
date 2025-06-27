import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useVincentApiWithSIWE } from '@/hooks/developer-dashboard/useVincentApiWithSIWE';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { CreateAppForm, type CreateAppFormData } from '../forms/CreateAppForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';

interface CreateAppWrapperProps {
  refetchApps: () => void;
}

export function CreateAppWrapper({ refetchApps }: CreateAppWrapperProps) {
  const vincentApi = useVincentApiWithSIWE();
  const [createApp, { isLoading, isSuccess, isError, data, error }] =
    vincentApi.useCreateAppMutation();
  const navigate = useNavigate();
  const { address } = useAccount();

  useEffect(() => {
    if (isSuccess && data) {
      refetchApps();
      navigateWithDelay(navigate, `/developer/appId/${data.appId}`);
    }
  }, [isSuccess, data, refetchApps, navigate]);

  // Show spinner while creating app or after success while refetching/navigating
  if (isLoading) {
    return <StatusMessage message="Creating app..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="App created successfully!" type="success" />;
  }

  // Error state
  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to create app');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: CreateAppFormData) => {
    await createApp({
      appCreate: { ...data, managerAddress: address },
    });
  };

  // Render pure form component
  return <CreateAppForm onSubmit={handleSubmit} isSubmitting={isLoading} />;
}
