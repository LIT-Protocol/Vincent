import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AppVersionsListView } from '../views/AppVersionsListView';
import { useUserApps } from '@/hooks/developer-dashboard/app/useUserApps';
import { useAddressCheck } from '@/hooks/developer-dashboard/app/useAddressCheck';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { sortAppFromApps } from '@/utils/developer-dashboard/sortAppFromApps';
import { AppVersion } from '@/types/developer-dashboard/appTypes';

export function AppVersionsWrapper() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const { data: apps, isLoading: appsLoading, isError: appsError } = useUserApps();

  const app = sortAppFromApps(apps, appId);

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

  useAddressCheck(app);

  // Loading states first
  if (appsLoading || versionsLoading) return <Loading />;

  // Combined error states
  if (appsError) return <StatusMessage message="Failed to load apps" type="error" />;
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
