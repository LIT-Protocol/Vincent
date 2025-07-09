import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { AppVersionTool } from '@/types/developer-dashboard/appTypes';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { Trash2 } from 'lucide-react';

interface DeleteAppVersionToolButtonProps {
  appId: number;
  versionId: number;
  tool: AppVersionTool;
}

export function DeleteAppVersionToolButton({
  appId,
  versionId,
  tool,
}: DeleteAppVersionToolButtonProps) {
  // Mutation
  const [deleteAppVersionTool, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useDeleteAppVersionToolMutation();

  // Mutation
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
    await deleteAppVersionTool({
      appId,
      appVersion: versionId,
      toolPackageName: tool.toolPackageName,
    });
  };

  return (
    <button
      onClick={() => handleSubmit()}
      className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition-colors"
    >
      <Trash2 className="h-4 w-4" />
      Delete Tool
    </button>
  );
}
