import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import Loading from '@/components/layout/Loading';
import { ExplorerHomeView } from '../views/HomeView';

export const ExplorerHomeWrapper = () => {
  const { data: apps, isLoading, isError } = vincentApiClient.useListAppsQuery();

  // Loading states
  if (isLoading) return <Loading />;

  // Error states
  if (isError) return <StatusMessage message="Failed to load apps" type="error" />;
  if (!apps) return <StatusMessage message={`Apps not found`} type="error" />;

  return <ExplorerHomeView apps={apps} />;
};
