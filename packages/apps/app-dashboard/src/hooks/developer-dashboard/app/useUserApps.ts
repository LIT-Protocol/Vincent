import { useMemo, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/developer-dashboard/useAuth';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { App } from '@/types/developer-dashboard/appTypes';
import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';

interface AppWithRegistryData extends App {
  isOwnedOnChain: boolean;
  isInRegistry: boolean;
}

export function useUserApps() {
  const { authAddress: address } = useAuth();

  const { data: allRegistryApps, isLoading: registryLoading } = vincentApiClient.useListAppsQuery();
  const [userAppsWithData, setUserAppsWithData] = useState<AppWithRegistryData[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch apps: on-chain first, then enrich with registry data
  useEffect(() => {
    if (!address) {
      setUserAppsWithData([]);
      return;
    }

    const fetchUserApps = async () => {
      setIsLoadingApps(true);
      setError(null);

      try {
        const client = getClient({ signer: readOnlySigner });

        // Step 1: Get ALL app IDs from on-chain where user is the manager/owner
        // Fetch with pagination since there might be more than 50 apps
        let allOnChainApps: { id: number; versionCount: number }[] = [];
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
          const batch = await client.getAppsByManagerAddress({
            managerAddress: address,
            offset: offset.toString(),
          });

          if (!batch || batch.length === 0) {
            hasMore = false;
          } else {
            allOnChainApps = [...allOnChainApps, ...batch];
            // If we got 50 results, there might be more
            if (batch.length === 50) {
              offset += 50;
            } else {
              hasMore = false;
            }
          }
        }

        if (allOnChainApps.length === 0) {
          setUserAppsWithData([]);
          setIsLoadingApps(false);
          return;
        }

        // Step 2: Match on-chain apps with registry data
        // We don't need to call getAppById again since we already know these exist on-chain
        const appsWithData = allOnChainApps.map(({ id }) => {
          // Find matching registry metadata
          const registryApp = allRegistryApps?.find((app: App) => app.appId === id);

          if (registryApp) {
            // Use registry data - app is on-chain AND in registry
            return {
              ...registryApp,
              isOwnedOnChain: true,
              isInRegistry: true,
            } as AppWithRegistryData;
          } else {
            // On-chain app without registry metadata - create minimal structure
            return {
              _id: `app-${id}`,
              appId: id,
              managerAddress: address, // We own it since getAppsByManagerAddress returned it
              isDeleted: false,
              name: `App ${id}`,
              description: '',
              logo: '',
              contactEmail: '',
              appUrl: '',
              deploymentStatus: 'dev' as const,
              activeVersion: undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isOwnedOnChain: true,
              isInRegistry: false,
            } as AppWithRegistryData;
          }
        });

        setUserAppsWithData(appsWithData);
      } catch (err) {
        console.error('Error fetching user apps:', err);
        setError(err as Error);
        setUserAppsWithData([]);
      } finally {
        setIsLoadingApps(false);
      }
    };

    fetchUserApps();
  }, [address, allRegistryApps]);

  // Separate active and deleted apps, sort by newest first
  const { userApps, deletedApps } = useMemo(() => {
    if (!userAppsWithData.length) return { userApps: [], deletedApps: [] };

    // Separate deleted and active apps
    const activeApps = userAppsWithData.filter((app) => !app.isDeleted);
    const deleted = userAppsWithData.filter((app) => app.isDeleted);

    // Sort by appId (newest first) - all apps are on-chain owned
    const sortedApps = activeApps.sort((a, b) => b.appId - a.appId);

    return { userApps: sortedApps, deletedApps: deleted };
  }, [userAppsWithData]);

  return {
    data: userApps,
    deletedApps,
    isLoading: registryLoading || isLoadingApps,
    isError: !!error,
    error,
  };
}
