import { useState, useEffect, useMemo } from 'react';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { AgentAppPermission } from '@/utils/user-dashboard/getAgentPkps';
import { App } from '@/types/developer-dashboard/appTypes';

interface UseSidebarDataProps {
  agentAppPermissions: AgentAppPermission[];
}

interface UseSidebarDataReturn {
  apps: App[];
  permittedAppVersions: Record<string, string>;
  appVersionsMap: Record<string, any[]>;
  isLoading: boolean;
  error: string | null;
}

export function useSidebarData({ agentAppPermissions }: UseSidebarDataProps): UseSidebarDataReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [apps, setApps] = useState<App[]>([]);
  const [permittedAppVersions, setPermittedAppVersions] = useState<Record<string, string>>({});
  const [appVersionsMap, setAppVersionsMap] = useState<Record<string, any[]>>({});
  const [error, setError] = useState<string | null>(null);

  // Build permitted app versions from the provided agent app permissions (memoized to prevent infinite loops)
  const permittedVersionsFromHook = useMemo(() => {
    return agentAppPermissions.reduce(
      (acc, agentPkp) => {
        if (agentPkp.permittedVersion !== null) {
          acc[agentPkp.appId.toString()] = agentPkp.permittedVersion.toString();
        }
        return acc;
      },
      {} as Record<string, string>,
    );
  }, [agentAppPermissions]);

  // Lazy queries
  const [triggerGetApps] = vincentApiClient.useLazyListAppsQuery();
  const [triggerGetAppVersions] = vincentApiClient.useLazyGetAppVersionsQuery();

  // Fetch all data when agentAppPermissions changes
  useEffect(() => {
    // If no permitted apps, set empty state and finish
    if (Object.keys(permittedVersionsFromHook).length === 0) {
      console.log('[useSidebarData] No permitted apps, setting empty state');
      setApps([]);
      setPermittedAppVersions({});
      setAppVersionsMap({});
      setIsLoading(false);
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
        if (Object.keys(permittedVersionsFromHook).length === 0) {
          setApps([]);
          setAppVersionsMap({});
          setIsLoading(false);
          return;
        }

        // Fetch all apps first
        const appsResponse = await triggerGetApps();
        const allApps = appsResponse.data || [];

        // Filter apps based on permitted app IDs
        const filteredApps = allApps.filter(
          (app) => app.appId.toString() in permittedVersionsFromHook,
        );

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
  }, [permittedVersionsFromHook]);

  return {
    apps,
    permittedAppVersions,
    appVersionsMap,
    isLoading,
    error,
  };
}
