import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/shared/ui/Loading';
import { ArchiveRestore } from 'lucide-react';
import { Tool } from '@/types/developer-dashboard/appTypes';

interface UndeleteToolWrapperProps {
  tool: Tool;
}

export function UndeleteToolButton({ tool }: UndeleteToolWrapperProps) {
  // Mutation
  const [undeleteTool, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useUndeleteToolMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data && tool) {
      navigate(`/developer/toolId/${encodeURIComponent(tool.packageName)}`);
    }
  }, [isSuccess, data, tool]);

  // Loading states
  if (isLoading) return <Loading />;

  // Error states
  if (!tool) return <StatusMessage message={`Tool not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Undeleting tool..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Tool undeleted successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to undelete tool');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async () => {
    await undeleteTool({
      packageName: tool.packageName,
    });
  };

  return (
    <button
      onClick={() => handleSubmit()}
      className="inline-flex items-center gap-2 px-4 py-2 border border-green-200 rounded-lg text-sm font-medium text-green-600 bg-white hover:bg-green-50 transition-colors relative z-10 !opacity-100 shadow-sm"
    >
      <ArchiveRestore className="h-4 w-4" />
      Undelete Tool
    </button>
  );
}
