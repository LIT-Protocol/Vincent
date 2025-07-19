import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DeleteToolForm } from '../forms/DeleteToolForm';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/shared/ui/Loading';

export function DeleteToolWrapper() {
  const { packageName } = useParams<{ packageName: string }>();

  // Fetching
  const {
    data: tool,
    isLoading: toolLoading,
    isError: toolError,
  } = vincentApiClient.useGetToolQuery({ packageName: packageName || '' });

  // Mutation
  const [deleteTool, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useDeleteToolMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data) {
      navigate('/developer/tools'); // Navigate immediately, no delay needed
    }
  }, [isSuccess, data, navigate]);

  // Loading states
  if (toolLoading) return <Loading />;

  // Error states
  if (toolError) return <StatusMessage message="Failed to load tool" type="error" />;
  if (!tool) return <StatusMessage message={`Tool ${packageName} not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Deleting tool..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Tool deleted successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to delete tool');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async () => {
    await deleteTool({ packageName: tool.packageName });
  };
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Delete Tool</h1>
          <p className="text-gray-600 mt-2">
            Permanently delete "{tool.title}" and all its data. This action cannot be undone.
          </p>
        </div>
      </div>

      <DeleteToolForm title={tool.title || ''} onSubmit={handleSubmit} isSubmitting={isLoading} />
    </div>
  );
}
