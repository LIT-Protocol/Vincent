import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import Loading from '@/components/shared/ui/Loading';
import { AppExploreView } from '../views/AppExploreView';
import { App } from '@/types/developer-dashboard/appTypes';

export const AppExploreWrapper = () => {
  const { data: apps, isLoading, isError } = vincentApiClient.useListAppsQuery();

  const activeApps = apps?.filter((app: App) => app.deploymentStatus !== 'dev') || [];

  // Loading states
  if (isLoading) return <Loading />;

  // Error states
  if (isError) return <StatusMessage message="Failed to load apps" type="error" />;
  if (!apps) return <StatusMessage message={`Apps not found`} type="error" />;

  return <AppExploreView apps={activeApps} />;
};
