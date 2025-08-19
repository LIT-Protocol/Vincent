import { useMemo, useState } from 'react';
import { PermittedAppsPage } from './PermittedAppsPage';
import { useAllAgentApps } from '@/hooks/user-dashboard/useAllAgentApps';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { PermittedAppsSkeleton } from './PermittedAppsSkeleton';
import { useReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { AuthenticationErrorScreen } from '../connect/AuthenticationErrorScreen';
import { GeneralErrorScreen } from '@/components/user-dashboard/connect/GeneralErrorScreen';
import { VincentYieldModal } from '../landing/VincentYieldModal';
import { env } from '@/config/env';

export function PermittedAppsWrapper() {
  const readAuthInfo = useReadAuthInfo();
  const { authInfo, sessionSigs, isProcessing, error } = readAuthInfo;

  const userAddress = authInfo?.userPKP?.ethAddress || '';
  const [showVincentYieldModal, setShowVincentYieldModal] = useState(false);
  const [hasUserDismissedModal, setHasUserDismissedModal] = useState(false);

  // Fetch all agent app permissions
  const {
    permittedPKPs,
    unpermittedPKPs,
    loading: permissionsLoading,
    error: permissionsError,
  } = useAllAgentApps(userAddress);

  // Check if Vincent Yield app is permitted
  const hasVincentYieldPerms = permittedPKPs.some((p) => p.appId === env.VITE_VINCENT_YIELD_APPID);

  // Fetch all apps from the API
  const {
    data: allApps,
    isLoading: appsLoading,
    error: appsError,
    isSuccess: appsSuccess,
  } = vincentApiClient.useListAppsQuery();

  // Filter apps based on agent app permissions
  const filteredApps = useMemo(() => {
    if (!allApps || !permittedPKPs.length) return [];

    const permittedAppIds = permittedPKPs.map((p) => p.appId);
    return allApps.filter((app) => permittedAppIds.includes(app.appId));
  }, [allApps, permittedPKPs]);

  // Show skeleton while auth is processing
  if (isProcessing) {
    return <PermittedAppsSkeleton />;
  }

  // Handle auth errors early
  if (error) {
    return <AuthenticationErrorScreen readAuthInfo={readAuthInfo} />;
  }

  // Handle missing auth or user address
  if (!userAddress) {
    return <PermittedAppsSkeleton />;
  }

  // Show skeleton while data is being fetched
  if (permissionsLoading || appsLoading || !appsSuccess) {
    return <PermittedAppsSkeleton />;
  }

  // Handle errors
  if (appsError || permissionsError) {
    const errorMessage = String(permissionsError || appsError || 'An error occurred');
    return <GeneralErrorScreen errorDetails={errorMessage} />;
  }

  const isUserAuthed = authInfo?.userPKP && sessionSigs;
  if (!isUserAuthed) {
    return <AuthenticationErrorScreen readAuthInfo={readAuthInfo} />;
  }

  // Use first unpermitted PKP for Vincent Yield modal (if any exist)
  const firstUnpermittedPkp = unpermittedPKPs.length > 0 ? unpermittedPKPs[0] : null;

  if (
    isUserAuthed &&
    !hasVincentYieldPerms &&
    !showVincentYieldModal &&
    !hasUserDismissedModal &&
    firstUnpermittedPkp
  ) {
    setShowVincentYieldModal(true);
  }

  return (
    <>
      <PermittedAppsPage apps={filteredApps} permittedPKPs={permittedPKPs} />
      {showVincentYieldModal && firstUnpermittedPkp && (
        <VincentYieldModal
          onClose={() => {
            setShowVincentYieldModal(false);
            setHasUserDismissedModal(true);
          }}
          agentPKP={firstUnpermittedPkp}
          readAuthInfo={readAuthInfo}
        />
      )}
    </>
  );
}
