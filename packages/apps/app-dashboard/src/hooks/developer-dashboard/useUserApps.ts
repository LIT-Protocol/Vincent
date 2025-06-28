import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { App } from '@/types/developer-dashboard/appTypes';

export function useUserApps() {
  const { address } = useAccount();

  const {
    data: allApps,
    isLoading,
    isError,
    error,
    refetch,
    ...rest
  } = vincentApiClient.useListAppsQuery();

  // Filter apps by current user
  const userApps = useMemo(() => {
    if (!address || !allApps?.length) return [];
    return allApps.filter((app: App) => app.managerAddress.toLowerCase() === address.toLowerCase());
  }, [allApps, address]);

  return {
    data: userApps,
    isLoading,
    isError,
    error,
    refetch,
    ...rest,
  };
}
