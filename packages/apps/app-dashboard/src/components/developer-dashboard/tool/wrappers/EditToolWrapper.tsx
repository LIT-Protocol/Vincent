import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserTools } from '@/hooks/developer-dashboard/tool/useUserTools';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { EditToolForm, type EditToolFormData } from '../forms/EditToolForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/layout/Loading';
import { sortToolFromTools } from '@/utils/developer-dashboard/sortToolFromTools';
import { useAddressCheck } from '@/hooks/developer-dashboard/tool/useAddressCheck';

export function EditToolWrapper() {
  const { packageName } = useParams<{ packageName: string }>();

  // Fetching
  const { data: tools, isLoading: toolsLoading, isError: toolsError } = useUserTools();

  const tool = sortToolFromTools(tools, packageName);

  const {
    data: toolVersions,
    isLoading: versionsLoading,
    isError: versionsError,
  } = vincentApiClient.useGetToolVersionsQuery({ packageName: packageName || '' });

  // Mutation
  const [editTool, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useEditToolMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data && tool) {
      navigateWithDelay(navigate, `/developer/toolId/${encodeURIComponent(tool.packageName)}`);
    }
  }, [isSuccess, data, tool]);

  useAddressCheck(tool);

  // Loading states
  if (toolsLoading || versionsLoading) return <Loading />;

  // Error states
  if (toolsError) return <StatusMessage message="Failed to load tools" type="error" />;
  if (versionsError) return <StatusMessage message="Failed to load tool versions" type="error" />;
  if (!tool) return <StatusMessage message={`Tool ${packageName} not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Updating tool..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Tool updated successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to update tool');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: EditToolFormData) => {
    const { packageName, ...toolEditData } = data;

    await editTool({
      packageName,
      toolEdit: { ...toolEditData },
    });
  };

  // Render with page UI and form component
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Edit {tool.packageName}</h1>
          <p className="text-gray-600 mt-2">Update your tool settings and configuration</p>
        </div>
      </div>

      <EditToolForm
        toolData={tool}
        toolVersions={toolVersions || []}
        onSubmit={handleSubmit}
        isSubmitting={isLoading}
      />
    </div>
  );
}
