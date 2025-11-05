import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArchiveRestore } from 'lucide-react';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';

import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import { App } from '@/types/developer-dashboard/appTypes';
import { ActionButton } from '@/components/developer-dashboard/ui/ActionButton';

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
      navigate(`/developer/apps/appId/${app.appId}`);
    }
  }, [isSuccess, data, app]);

  // Error states
  if (!app) return <StatusMessage message={`App not found`} type="error" />;

  // Success state
  if (isSuccess && data) {
    return <StatusMessage message="App undeleted successfully!" type="success" />;
  }

  // Error state
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
    <ActionButton
      icon={ArchiveRestore}
      title="Undelete App"
      description="Restore this application from the deleted state"
      onClick={handleSubmit}
      isLoading={isLoading}
      variant="success"
    />
  );
}
