import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import {
  CreateToolVersionForm,
  type CreateToolVersionFormData,
} from '../forms/CreateToolVersionForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/shared/ui/Loading';

export function CreateToolVersionWrapper() {
  const { packageName } = useParams<{ packageName: string }>();

  // Fetching
  const {
    data: tool,
    isLoading: toolLoading,
    isError: toolError,
  } = vincentApiClient.useGetToolQuery({ packageName: packageName || '' });

  // Mutation
  const [createToolVersion, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useCreateToolVersionMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data && tool) {
      navigateWithDelay(
        navigate,
        `/developer/toolId/${encodeURIComponent(tool.packageName)}/version/${data.version}`,
      );
    }
  }, [isSuccess, data, navigate, tool]);

  // Loading states
  if (toolLoading) return <Loading />;

  // Error states
  if (toolError) return <StatusMessage message="Failed to load tool" type="error" />;
  if (!tool) return <StatusMessage message={`Tool ${packageName} not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Creating tool version..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Tool version created successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to create tool version');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: CreateToolVersionFormData) => {
    await createToolVersion({
      packageName: tool.packageName,
      version: data.version,
      toolVersionCreate: {
        changes: data.changes,
      },
    });
  };

  // Render with page UI and form component
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Create New Version</h1>
          <p className="text-gray-600 mt-2">
            Create a new version of your tool with updated features
          </p>
        </div>
      </div>

      <CreateToolVersionForm tool={tool} onSubmit={handleSubmit} isSubmitting={isLoading} />
    </div>
  );
}
