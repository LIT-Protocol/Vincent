import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { CreateAppForm, type CreateAppFormData } from '../forms/CreateAppForm';
import { navigateWithDelay } from '@/utils/developer-dashboard/app-forms';
import { Breadcrumb } from '@/components/shared/ui/Breadcrumb';

export function CreateAppWrapper() {
  // Mutation
  const [createApp, { isLoading, isSuccess, data }] = vincentApiClient.useCreateAppMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data) {
      navigateWithDelay(navigate, `/developer/apps/appId/${data.appId}/version/1/abilities`);
    }
  }, [isSuccess, data, navigate]);

  const handleSubmit = async (data: CreateAppFormData) => {
    await createApp({
      appCreate: { ...data },
    }).unwrap();
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Apps', onClick: () => navigate('/developer/apps') },
          { label: 'Create App' },
        ]}
      />
      <CreateAppForm onSubmit={handleSubmit} isSubmitting={isLoading} />
    </>
  );
}
