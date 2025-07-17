import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { AppSidebar } from '../dashboard/AppSidebar';
import { SidebarSkeleton } from './SidebarSkeleton';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { useUserPermissionsMiddleware } from '@/hooks/user-dashboard/dashboard/useUserPermissionsMiddleware';
import { useMemo } from 'react';

export function SidebarWrapper() {
  const { authInfo, isProcessing, error } = useReadAuthInfo();

  // Fetch apps from on-chain
  const {
    permittedApps,
    isLoading: permissionsLoading,
    error: UserPermissionsError,
  } = useUserPermissionsMiddleware({
    pkpTokenId: authInfo?.agentPKP?.tokenId || '',
  });

  // Fetch all apps from the API
  const {
    data: allApps,
    isLoading: appsLoading,
    error: appsError,
  } = vincentApiClient.useListAppsQuery();

  // Filter apps based on permitted app IDs
  const filteredApps = useMemo(() => {
    if (!allApps || !permittedApps.length) return [];

    return allApps.filter((app) => permittedApps.includes(app.appId.toString()));
  }, [allApps, permittedApps]);

  // Show skeleton while auth is processing
  if (isProcessing) {
    return <SidebarSkeleton />;
  }

  // Handle auth errors early
  if (error) return <StatusMessage message="Authentication failed" type="error" />;

  // Handle missing auth or PKP token
  if (!authInfo?.agentPKP?.tokenId) {
    return (
      <StatusMessage
        message="No PKP token found. Please authenticate with a valid PKP."
        type="error"
      />
    );
  }

  if (appsError || UserPermissionsError)
    return (
      <StatusMessage
        message={`Failed to load available apps, ${appsError || UserPermissionsError}`}
        type="error"
      />
    );

  // Show skeleton while data is being fetched
  if (permissionsLoading || appsLoading) {
    return <SidebarSkeleton />;
  }

  return <AppSidebar apps={filteredApps} isLoadingApps={permissionsLoading || appsLoading} />;
}
