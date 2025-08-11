import { useMemo, useState } from 'react';
import { PermittedAppsPage } from './PermittedAppsPage';
import { useUserPermissionsMiddleware } from '@/hooks/user-dashboard/dashboard/useUserPermissionsMiddleware';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { PermittedAppsSkeleton } from './PermittedAppsSkeleton';
import { useReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { AuthenticationErrorScreen } from '../connect/AuthenticationErrorScreen';
import { GeneralErrorScreen } from '@/components/user-dashboard/connect/GeneralErrorScreen';
import { VincentYieldModal } from '../landing/VincentYieldModal';
import { env } from '@/config/env';

export function PermittedAppsWrapper() {
  const { authInfo, sessionSigs, isProcessing, error } = useReadAuthInfo();

  const pkpEthAddress = authInfo?.userPKP?.ethAddress || '';
  const agentPKPs = authInfo?.agentPKPs || {};
  const [showVincentYieldModal, setShowVincentYieldModal] = useState(false);
  const [hasUserDismissedModal, setHasUserDismissedModal] = useState(false);

  // Check if user has Vincent Yield permissions by checking if they have an agent PKP for it
  const hasVincentYieldPerms = !!agentPKPs[env.VITE_VINCENT_YIELD_APPID];

  // Fetch apps from on-chain using the modified hook that works with agent PKPs
  const {
    permittedApps,
    permittedAppVersions,
    isLoading: permissionsLoading,
    error: UserPermissionsError,
  } = useUserPermissionsMiddleware({
    agentPKPs,
  });

  // Fetch all apps from the API
  const {
    data: allApps,
    isLoading: appsLoading,
    error: appsError,
    isSuccess: appsSuccess,
  } = vincentApiClient.useListAppsQuery();

  // Filter apps based on permitted app IDs and add permitted versions
  const filteredApps = useMemo(() => {
    if (!allApps || !permittedApps?.length) return [];

    return allApps
      .filter((app) => permittedApps.includes(app.appId))
      .map((app) => ({
        ...app,
        // Show the version that this PKP has permission to use
        activeVersion: Number(permittedAppVersions[app.appId.toString()]),
      }));
  }, [allApps, permittedApps, permittedAppVersions]);

  // Show skeleton while auth is processing
  if (isProcessing) {
    return <PermittedAppsSkeleton />;
  }

  // Handle auth errors early
  if (error) {
    return (
      <AuthenticationErrorScreen readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }} />
    );
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

  // Handle errors (but only after we've finished loading)
  if (!permissionsLoading && !appsLoading && (appsError || UserPermissionsError)) {
    return (
      <GeneralErrorScreen errorDetails={appsError || UserPermissionsError || 'An error occurred'} />
    );
  }

  const isUserAuthed = authInfo?.userPKP && sessionSigs;
  if (!isProcessing && !isUserAuthed) {
    return (
      <AuthenticationErrorScreen readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }} />
    );
  }

  if (isUserAuthed && !hasVincentYieldPerms && !showVincentYieldModal && !hasUserDismissedModal) {
    setShowVincentYieldModal(true);
  }

  return (
    <>
      <PermittedAppsPage apps={filteredApps} />
      <VincentYieldModal
        isOpen={showVincentYieldModal}
        onClose={() => {
          setShowVincentYieldModal(false);
          setHasUserDismissedModal(true);
        }}
        agentPkpAddress={pkpEthAddress}
      />
    </>
  );
}
