import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DeleteToolVersionForm, DeleteToolVersionFormData } from '../forms/DeleteToolVersionForm';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/shared/ui/Loading';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';

export function DeleteToolVersionWrapper() {
  const { packageName, version } = useParams<{ packageName: string; version: string }>();

  // Fetching
  const {
    data: tool,
    isLoading: toolLoading,
    isError: toolError,
  } = vincentApiClient.useGetToolQuery({ packageName: packageName || '' });

  const {
    data: versionsData,
    isLoading: versionLoading,
    isError: versionError,
  } = vincentApiClient.useGetToolVersionsQuery({ packageName: packageName || '' });

  // Mutation
  const [deleteToolVersion, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useDeleteToolVersionMutation();

  const [
    editTool,
    {
      isLoading: editToolLoading,
      isSuccess: editToolSuccess,
      isError: isEditToolError,
      data: editToolData,
      error: editToolError,
    },
  ] = vincentApiClient.useEditToolMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data) {
      navigate(`/developer/toolId/${encodeURIComponent(packageName!)}/versions`); // Navigate immediately, no delay needed
    }
  }, [isSuccess, data, navigate]);

  // Loading states
  if (toolLoading || versionLoading) return <Loading />;

  // Error states
  if (toolError) return <StatusMessage message="Failed to load tool" type="error" />;
  if (versionError) return <StatusMessage message="Failed to load tool version" type="error" />;
  if (!tool) return <StatusMessage message={`Tool ${packageName} not found`} type="error" />;
  if (!versionsData)
    return <StatusMessage message={`Tool version ${version} not found`} type="error" />;

  // Mutation states
  if (isLoading || editToolLoading) {
    return <StatusMessage message="Deleting tool..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Tool deleted successfully!" type="success" />;
  }

  if (editToolSuccess && editToolData) {
    return <StatusMessage message="Active version updated successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to delete tool');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  if (isEditToolError && editToolError) {
    const errorMessage = getErrorMessage(editToolError, 'Failed to update active version');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (formData: DeleteToolVersionFormData) => {
    if (tool.activeVersion === version && formData.activeVersion) {
      await editTool({
        packageName: tool.packageName,
        toolEdit: {
          activeVersion: formData.activeVersion,
        },
      });
    }
    await deleteToolVersion({ packageName: tool.packageName, version: version || '' });
  };
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Delete Tool Version</h1>
          <p className="text-gray-600 mt-2">
            Delete "{tool.title}" version {version}. This action can be undone.
          </p>
        </div>
      </div>

      <DeleteToolVersionForm
        tool={tool}
        version={version || ''}
        versions={versionsData}
        onSubmit={handleSubmit}
        isSubmitting={isLoading}
      />
    </div>
  );
}
