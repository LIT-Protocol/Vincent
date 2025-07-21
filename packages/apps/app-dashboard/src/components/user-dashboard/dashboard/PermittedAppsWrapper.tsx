import { useMemo } from 'react';
import { PermittedAppsPage } from './PermittedAppsPage';
import { useUserPermissionsMiddleware } from '@/hooks/user-dashboard/dashboard/useUserPermissionsMiddleware';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { PermittedAppsSkeleton } from './PermittedAppsSkeleton';
import { useReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { AuthenticationErrorScreen } from '../consent/AuthenticationErrorScreen';
import { GeneralErrorScreen } from '@/components/user-dashboard/consent/GeneralErrorScreen';

export function PermittedAppsWrapper() {
  const { authInfo, sessionSigs, isProcessing, error } = useReadAuthInfo();

  const pkpEthAddress = authInfo?.agentPKP?.ethAddress || '';

  // Fetch apps from on-chain
  const {
    permittedApps,
    isLoading: permissionsLoading,
    error: UserPermissionsError,
  } = useUserPermissionsMiddleware({
    pkpEthAddress,
  });

  // Fetch all apps from the API
  const {
    data: allApps,
    isLoading: appsLoading,
    error: appsError,
    isSuccess: appsSuccess,
  } = vincentApiClient.useListAppsQuery();

  // Filter apps based on permitted app IDs
  const filteredApps = useMemo(() => {
    if (!allApps || !permittedApps?.length) return [];

    return allApps.filter((app) => permittedApps.includes(app.appId));
  }, [allApps, permittedApps]);

  // Show skeleton while auth is processing
  if (isProcessing) {
    return <PermittedAppsSkeleton />;
  }

  // Handle auth errors early
  if (error) {
    return <AuthenticationErrorScreen />;
  }

  // Handle missing auth or PKP token
  if (!pkpEthAddress) {
    return <PermittedAppsSkeleton />;
  }

  // Show skeleton while data is being fetched
  if (permissionsLoading || appsLoading || !appsSuccess) {
    return <PermittedAppsSkeleton />;
  }

  // Show skeleton if permissions haven't been loaded yet (null means not loaded)
  if (permittedApps === null) {
    return <PermittedAppsSkeleton />;
  }

  // Handle errors
  if (appsError || UserPermissionsError) {
    return (
      <GeneralErrorScreen errorDetails={appsError || UserPermissionsError || 'An error occurred'} />
    );
  }

  const isUserAuthed = authInfo?.userPKP && authInfo?.agentPKP && sessionSigs;
  if (!isUserAuthed) {
    return <AuthenticationErrorScreen />;
  }

  return <PermittedAppsPage apps={filteredApps} />;
}
