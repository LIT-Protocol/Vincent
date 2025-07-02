import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/layout/Loading';
import { ArchiveRestore } from 'lucide-react';
import { AppVersion } from '@/types/developer-dashboard/appTypes';

interface UndeleteAppVersionWrapperProps {
  appVersion: AppVersion;
}

export function UndeleteAppVersionButton({ appVersion }: UndeleteAppVersionWrapperProps) {
  // Mutation
  const [undeleteAppVersion, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useUndeleteAppVersionMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data && appVersion) {
      navigate(`/developer/appId/${appVersion.appId}`);
    }
  }, [isSuccess, data, appVersion]);

  // Loading states
  if (isLoading) return <Loading />;

  // Error states
  if (!appVersion) return <StatusMessage message={`App version not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Undeleting app version..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="App version undeleted successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to undelete app version');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async () => {
    await undeleteAppVersion({
      appId: appVersion.appId,
      version: appVersion.version,
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
