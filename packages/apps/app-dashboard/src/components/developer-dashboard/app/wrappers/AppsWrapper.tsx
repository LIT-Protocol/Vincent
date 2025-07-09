import { useUserApps } from '@/hooks/developer-dashboard/app/useUserApps';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { AppsListView } from '../views/AppsListView';

export function AppsWrapper() {
  const { data: apps, deletedApps, isLoading: appsLoading, isError: appsError } = useUserApps();

  // Loading states first
  if (appsLoading) return <Loading />;

  // Combined error states
  if (appsError) return <StatusMessage message="Failed to load apps" type="error" />;

  return <AppsListView apps={apps} deletedApps={deletedApps} />;
}
