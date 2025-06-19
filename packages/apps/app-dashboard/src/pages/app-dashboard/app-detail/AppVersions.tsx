import { useAccount } from 'wagmi';
import { AppVersionsListView } from '@/components/app-dashboard/AppVersionsListView';
import { StatusMessage } from '@/utils/shared/statusMessage';
import Loading from '@/layout/app-dashboard/Loading';
import { useAppDetail } from '@/components/app-dashboard/AppDetailContext';
import { useNavigate } from 'react-router';

export default function AppVersions() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const { appId, app, appError, appLoading, versions, versionsError, versionsLoading } =
    useAppDetail();

  // Loading state
  if (appLoading) return <Loading />;

  // Error handling
  if (appError || !app) {
    return <StatusMessage message="App not found" type="error" />;
  }

  // Authorization check
  if (app.managerAddress.toLowerCase() !== address?.toLowerCase()) {
    navigate('/developer');
  }

  // Versions error handling
  if (versionsError) {
    return <StatusMessage message="Error loading app versions" type="error" />;
  }

  return (
    <AppVersionsListView
      versions={versions || []}
      appName={app.name}
      appId={appId}
      latestVersion={app.latestVersion}
      isLoading={versionsLoading}
      error={versionsError}
    />
  );
}
