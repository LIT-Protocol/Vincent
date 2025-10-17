import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { AppExploreView } from '../views/AppExploreView';
import LoadingLock from '@/components/shared/ui/LoadingLock';
import { ExplorerErrorPage } from '../ui/ExplorerErrorPage';
import { ExplorerNav } from '../ui/ExplorerNav';
import { App } from '@/types/developer-dashboard/appTypes';

export const AppExploreWrapper = () => {
  const { data: apps, isLoading, isError } = vincentApiClient.useListAppsQuery();

  const activeApps = apps?.filter((app: App) => app.deploymentStatus !== 'dev') || [];

  // Loading states
  if (isLoading) {
    return (
      <div className="w-full relative">
        <ExplorerNav />
        <div
          className="flex items-center justify-center"
          style={{ minHeight: 'calc(100vh - 200px)', paddingTop: '4rem' }}
        >
          <LoadingLock />
        </div>
      </div>
    );
  }

  // Error states
  if (isError) {
    return (
      <ExplorerErrorPage
        title="Failed to Load Apps"
        message="We couldn't load the app explorer. This might be due to a network issue or server problem."
      />
    );
  }

  if (!apps) {
    return (
      <ExplorerErrorPage
        title="No Apps Found"
        message="No applications are currently available in the explorer."
      />
    );
  }

  return <AppExploreView apps={activeApps} />;
};
