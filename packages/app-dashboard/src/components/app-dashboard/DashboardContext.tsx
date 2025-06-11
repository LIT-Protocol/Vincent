import { createContext, useContext, ReactNode, useMemo, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { vincentApiClient } from '@/components/app-dashboard/mock-forms/vincentApiClient';

interface DashboardContextType {
  apps: any[];
  tools: any[];
  policies: any[];
  loading: {
    apps: boolean;
    tools: boolean;
    policies: boolean;
    isRefetching: boolean;
  };
  errors: {
    apps: string | null;
    tools: string | null;
    policies: string | null;
  };
  refetch: {
    apps: () => void;
    tools: () => void;
    policies: () => void;
  };
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
};

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount();

  const {
    data: apiApps = [],
    error: appsError,
    isLoading: appsLoading,
    refetch: refetchApps,
  } = vincentApiClient.useListAppsQuery();

  const [getAllTools, { data: allTools = [], error: toolsError, isLoading: toolsLoading }] =
    vincentApiClient.useLazyListAllToolsQuery();
  const [
    getAllPolicies,
    { data: allPolicies = [], error: policiesError, isLoading: policiesLoading },
  ] = vincentApiClient.useLazyListAllPoliciesQuery();

  // Automatically fetch tools and policies when provider mounts
  useEffect(() => {
    getAllTools();
    getAllPolicies();
  }, [getAllTools, getAllPolicies]);

  // Filter data by user address
  const filteredApps = useMemo(() => {
    if (!address || !apiApps?.length) return [];
    return apiApps.filter((app: any) => app.managerAddress.toLowerCase() === address.toLowerCase());
  }, [apiApps, address]);

  const filteredTools = useMemo(() => {
    if (!address || !allTools?.length) return [];
    return allTools.filter(
      (tool: any) => tool.authorWalletAddress.toLowerCase() === address.toLowerCase(),
    );
  }, [allTools, address]);

  const filteredPolicies = useMemo(() => {
    if (!address || !allPolicies?.length) return [];
    return allPolicies.filter(
      (policy: any) => policy.authorWalletAddress.toLowerCase() === address.toLowerCase(),
    );
  }, [allPolicies, address]);

  const value: DashboardContextType = {
    apps: filteredApps,
    tools: filteredTools,
    policies: filteredPolicies,
    loading: {
      apps: appsLoading,
      tools: toolsLoading,
      policies: policiesLoading,
      isRefetching: appsLoading || toolsLoading || policiesLoading,
    },
    errors: {
      apps: appsError ? 'Failed to load apps' : null,
      tools: toolsError ? 'Failed to load tools' : null,
      policies: policiesError ? 'Failed to load policies' : null,
    },
    refetch: {
      apps: refetchApps,
      tools: () => getAllTools(),
      policies: () => getAllPolicies(),
    },
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}
