import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/layout/Loading';
import { ArchiveRestore } from 'lucide-react';
import { App } from '@/types/developer-dashboard/appTypes';

interface UndeleteAppWrapperProps {
  app: App;
}

export function UndeleteAppButton({ app }: UndeleteAppWrapperProps) {
  // Mutation
  const [undeleteApp, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useUndeleteAppMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data && app) {
      navigate(`/developer/appId/${app.appId}`);
    }
  }, [isSuccess, data, app]);

  // Loading states
  if (isLoading) return <Loading />;

  // Error states
  if (!app) return <StatusMessage message={`App not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Undeleting app..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="App undeleted successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to undelete app');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async () => {
    await undeleteApp({
      appId: app.appId,
    });
  };

  return (
    <button
      onClick={() => handleSubmit()}
      className="inline-flex items-center gap-2 px-4 py-2 border border-green-200 rounded-lg text-sm font-medium text-green-600 bg-white hover:bg-green-50 transition-colors relative z-10 !opacity-100 shadow-sm"
    >
      <ArchiveRestore className="h-4 w-4" />
      Undelete App
    </button>
  );
}
