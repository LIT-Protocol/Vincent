import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/layout/Loading';
import { ArchiveRestore } from 'lucide-react';
import { AppVersionTool } from '@/types/developer-dashboard/appTypes';

interface UndeleteAppVersionToolWrapperProps {
  appVersionTool: AppVersionTool;
}

export function UndeleteAppVersionToolButton({
  appVersionTool,
}: UndeleteAppVersionToolWrapperProps) {
  // Mutation
  const [undeleteAppVersionTool, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useUndeleteAppVersionToolMutation();

  // Loading states
  if (isLoading) return <Loading />;

  // Error states
  if (!appVersionTool) return <StatusMessage message={`App version tool not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Undeleting app version tool..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="App version tool undeleted successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to undelete app version tool');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async () => {
    await undeleteAppVersionTool({
      appId: appVersionTool.appId,
      appVersion: appVersionTool.appVersion,
      toolPackageName: appVersionTool.toolPackageName,
    });
  };

  return (
    <button
      onClick={() => handleSubmit()}
      className="inline-flex items-center gap-2 px-4 py-2 border border-green-200 rounded-lg text-sm font-medium text-green-600 bg-white hover:bg-green-50 transition-colors relative z-10 !opacity-100 shadow-sm"
    >
      <ArchiveRestore className="h-4 w-4" />
      Undelete App Version
    </button>
  );
}
