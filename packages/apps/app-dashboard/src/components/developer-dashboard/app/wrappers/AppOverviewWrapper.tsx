import { useNavigate, useParams } from 'react-router-dom';
import { AppDetailsView } from '../views/AppDetailsView';
import { useUserApps } from '@/hooks/developer-dashboard/useUserApps';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { sortAppFromApps } from '@/utils/developer-dashboard/sortAppFromApps';

export function AppOverviewWrapper() {
  const { appId } = useParams<{ appId: string }>();

  // Fetching
  const { data: apps, isLoading, isError } = useUserApps();

  const app = sortAppFromApps(apps, appId);

  // Navigation
  const navigate = useNavigate();

  // Loading
  if (isLoading) return <Loading />;
  if (isError) return <StatusMessage message="Failed to load apps" type="error" />;
  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;

  const handleOpenMutation = (mutationType: string) => {
    navigate(`/developer/appId/${appId}/${mutationType}`);
  };

  return <AppDetailsView selectedApp={app} onOpenMutation={handleOpenMutation} />;
}
