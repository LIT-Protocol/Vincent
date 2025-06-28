import { useNavigate, useParams } from 'react-router';
import { AppVersionsListView } from '../views/AppVersionsListView';
import { useUserApps } from '@/hooks/developer-dashboard/useUserApps';
import { useAddressCheck } from '@/hooks/developer-dashboard/app/useAddressCheck';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { sortAppFromApps } from '@/utils/developer-dashboard/sortAppFromApps';

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
      versions={versions || []}
      activeVersion={app.activeVersion}
      onVersionClick={handleVersionClick}
    />
  );
}
