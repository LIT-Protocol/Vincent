import { useMemo } from 'react';
import { useAuth } from '@/hooks/developer-dashboard/useAuth';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { App } from '@/types/developer-dashboard/appTypes';

export function useUserApps() {
  const { authAddress: address } = useAuth();

  const { data: allApps, isLoading, isError, error, ...rest } = vincentApiClient.useListAppsQuery();

  // Filter apps by current user and separate active vs deleted
  const { userApps, deletedApps } = useMemo(() => {
    if (!address || !allApps?.length) return { userApps: [], deletedApps: [] };

    const filteredApps = allApps.filter(
      (app: App) => app.managerAddress.toLowerCase() === address.toLowerCase(),
    );

    const userApps = filteredApps.filter((app: App) => !app.isDeleted!);
    const deletedApps = filteredApps.filter((app: App) => app.isDeleted);

    return { userApps, deletedApps };
  }, [allApps, address]);

  return {
    data: userApps,
    deletedApps,
    isLoading,
    isError,
    error,
    ...rest,
  };
}
