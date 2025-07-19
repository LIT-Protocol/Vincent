import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AppVersionsListView } from '../views/AppVersionsListView';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { AppVersion } from '@/types/developer-dashboard/appTypes';

export function AppVersionsWrapper() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();

  // Fetch app
  const {
    data: app,
    isLoading: appLoading,
    isError: appError,
  } = vincentApiClient.useGetAppQuery({ appId: Number(appId) });

  // Fetch app versions
  const {
    data: versions,
    isLoading: versionsLoading,
    isError: versionsError,
  } = vincentApiClient.useGetAppVersionsQuery({ appId: Number(appId) });

  // Separate active and deleted versions
  const { activeVersions, deletedVersions } = useMemo(() => {
    if (!versions?.length) return { activeVersions: [], deletedVersions: [] };
    const activeVersions = versions.filter((version: AppVersion) => !version.isDeleted);
    const deletedVersions = versions.filter((version: AppVersion) => version.isDeleted);
    return { activeVersions, deletedVersions };
  }, [versions]);

  // Loading states first
  if (appLoading || versionsLoading) return <Loading />;

  // Combined error states
  if (appError) return <StatusMessage message="Failed to load app" type="error" />;
  if (versionsError) return <StatusMessage message="Failed to load app versions" type="error" />;
  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;

  const handleVersionClick = (version: number) => {
    navigate(`/developer/appId/${appId}/version/${version}`);
  };

  return (
    <AppVersionsListView
      versions={activeVersions}
      deletedVersions={deletedVersions}
      activeVersion={app.activeVersion}
      onVersionClick={handleVersionClick}
    />
  );
}
