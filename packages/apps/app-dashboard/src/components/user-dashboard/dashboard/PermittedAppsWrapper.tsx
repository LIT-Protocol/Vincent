import { useMemo } from 'react';
import { PermittedAppsPage } from './PermittedAppsPage';
import { useUserPermissionsMiddleware } from '@/hooks/user-dashboard/dashboard/useUserPermissionsMiddleware';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { PermittedAppsSkeleton } from './PermittedAppsSkeleton';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { useReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { AuthenticationErrorScreen } from '../consent/AuthenticationErrorScreen';

export function PermittedAppsWrapper() {
  const { authInfo, sessionSigs, isProcessing, error } = useReadAuthInfo();

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

  if (isProcessing) {
    return <PermittedAppsSkeleton />;
  }

  if (appsError || UserPermissionsError || error)
    return (
      <StatusMessage
        message={`Failed to load available apps, ${appsError || UserPermissionsError || error}`}
        type="error"
      />
    );

  const isUserAuthed = authInfo?.userPKP && authInfo?.agentPKP && sessionSigs;
    if (!isProcessing && !isUserAuthed) {
      return <AuthenticationErrorScreen />;
    }

  // Show skeleton while data is being fetched
  if (permissionsLoading || appsLoading) {
    return <PermittedAppsSkeleton />;
  }

  return <PermittedAppsPage apps={filteredApps} />;
}