import { useState, useEffect } from 'react';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { useUserPermissionsMiddleware } from '@/hooks/user-dashboard/dashboard/useUserPermissionsMiddleware';
import { App } from '@/types/developer-dashboard/appTypes';

interface UseSidebarDataProps {
  pkpEthAddress: string;
}

interface UseSidebarDataReturn {
  apps: App[];
  permittedAppVersions: Record<string, string>;
  appVersionsMap: Record<string, any[]>;
  isLoading: boolean;
  error: string | null;
}

export function useSidebarData({ pkpEthAddress }: UseSidebarDataProps): UseSidebarDataReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [apps, setApps] = useState<App[]>([]);
  const [permittedAppVersions, setPermittedAppVersions] = useState<Record<string, string>>({});
  const [appVersionsMap, setAppVersionsMap] = useState<Record<string, any[]>>({});
  const [error, setError] = useState<string | null>(null);

  // Get permissions data
  const {
    permittedApps,
    permittedAppVersions: permittedVersionsFromHook,
    isLoading: permissionsLoading,
    error: permissionsError,
  } = useUserPermissionsMiddleware({ pkpEthAddress });

  // Lazy queries
  const [triggerGetApps] = vincentApiClient.useLazyListAppsQuery();
  const [triggerGetAppVersions] = vincentApiClient.useLazyGetAppVersionsQuery();

  // Fetch all data when permissions are ready
  useEffect(() => {
    // Don't start if permissions are still loading
    if (permissionsLoading) {
      return;
    }

    // Handle permissions error
    if (permissionsError && permissionsError !== 'Missing pkpTokenId') {
      setError(`Failed to load permissions: ${permissionsError}`);
      setIsLoading(false);
      return;
    }

    // Don't start if permissions haven't loaded yet (null means not loaded)
    if (permittedApps === null) {
      return;
    }

    // Reset states when starting fetch
    setIsLoading(true);
    setError(null);

    const fetchAllData = async () => {
      try {
        // Set permitted app versions from permissions
        setPermittedAppVersions(permittedVersionsFromHook || {});

        // If no permitted apps, we're done immediately
        if (!permittedApps.length) {
          setApps([]);
          setAppVersionsMap({});
          setIsLoading(false);
          return;
        }

        // Fetch all apps first
        const appsResponse = await triggerGetApps();
        const allApps = appsResponse.data || [];

        // Filter apps based on permitted app IDs
        const filteredApps = allApps.filter((app) => permittedApps.includes(app.appId));

        setApps(filteredApps);

        // If no filtered apps, we're done
        if (!filteredApps.length) {
          setAppVersionsMap({});
          setIsLoading(false);
          return;
        }

        // Fetch app versions for filtered apps
        const versionPromises = filteredApps.map(async (app) => {
          const response = await triggerGetAppVersions({ appId: app.appId });
          return { appId: app.appId.toString(), versions: response.data || [] };
        });

        const results = await Promise.all(versionPromises);
        const versionsMap: Record<string, any[]> = {};

        results.forEach(({ appId, versions }) => {
          versionsMap[appId] = versions;
        });

        setAppVersionsMap(versionsMap);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching sidebar data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch sidebar data');
        setIsLoading(false); // Only set false on failure (with error)
      }
    };

    fetchAllData();
  }, [permissionsLoading, permissionsError, permittedApps, permittedVersionsFromHook]); // Dependencies from permissions hook

  return {
    apps,
    permittedAppVersions,
    appVersionsMap,
    isLoading,
    error,
  };
}
