import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DeleteAppForm } from '../forms/DeleteAppForm';
import { useUserApps } from '@/hooks/developer-dashboard/app/useUserApps';
import { useAddressCheck } from '@/hooks/developer-dashboard/app/useAddressCheck';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/layout/Loading';
import { sortAppFromApps } from '@/utils/developer-dashboard/sortAppFromApps';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';

export function DeleteAppWrapper() {
  const { appId } = useParams<{ appId: string }>();

  // Fetching
  const { data: apps, isLoading: appsLoading, isError: appsError } = useUserApps();

  const app = sortAppFromApps(apps, appId);

  // Mutation
  const [deleteApp, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useDeleteAppMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data) {
      navigate('/developer/apps'); // Navigate immediately, no delay needed
    }
  }, [isSuccess, data, navigate]);

  useAddressCheck(app);

  // Loading states
  if (appsLoading) return <Loading />;

  // Error states
  if (appsError) return <StatusMessage message="Failed to load apps" type="error" />;
  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Deleting app..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="App deleted successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to delete app');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async () => {
    await deleteApp({ appId: app.appId });
  };
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Delete App</h1>
          <p className="text-gray-600 mt-2">
            Permanently delete "{app.name}" and all its data. This action cannot be undone.
          </p>
        </div>
      </div>

      <DeleteAppForm appName={app.name} onSubmit={handleSubmit} isSubmitting={isLoading} />
    </div>
  );
}
