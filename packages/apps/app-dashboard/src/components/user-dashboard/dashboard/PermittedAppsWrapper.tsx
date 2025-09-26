import { useMemo, useState } from 'react';
import * as Sentry from '@sentry/react';
import { PermittedAppsPage } from './PermittedAppsPage';
import { useAllAgentApps } from '@/hooks/user-dashboard/useAllAgentApps';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { PermittedAppsSkeleton } from './PermittedAppsSkeleton';
import { useReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { AuthenticationErrorScreen } from '../connect/AuthenticationErrorScreen';
import { GeneralErrorScreen } from '@/components/user-dashboard/connect/GeneralErrorScreen';
import { VincentYieldModal } from '../landing/VincentYieldModal';
import { ConnectToVincentYieldModal } from '../landing/ConnectToVincentYieldModal';
import { env } from '@/config/env';

export function PermittedAppsWrapper() {
  const readAuthInfo = useReadAuthInfo();
  const { authInfo, sessionSigs, isProcessing, error } = readAuthInfo;

  const userAddress = authInfo?.userPKP?.ethAddress || '';
  const [showVincentYieldModal, setShowVincentYieldModal] = useState(false);
  const [hasUserDismissedModal, setHasUserDismissedModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Fetch all agent app permissions
  const {
    permittedPKPs,
    loading: permissionsLoading,
    error: permissionsError,
  } = useAllAgentApps(userAddress);

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
    const error = permissionsError || appsError || new Error('An error occurred');
    Sentry.captureException(error);
    return <GeneralErrorScreen errorDetails={String(error)} />;
  }

  const isUserAuthed = authInfo?.userPKP && sessionSigs;
  if (!isUserAuthed) {
    return <AuthenticationErrorScreen readAuthInfo={readAuthInfo} />;
  }

  // Find the agent PKP that's permitted for Vincent Yield
  const vincentYieldPKP = permittedPKPs.find(
    (pkp) => pkp.appId === Number(env.VITE_VINCENT_YIELD_APPID),
  );

  // Find PKPs with appId = -1 (unconnected PKPs)
  const unconnectedPKP = permittedPKPs.find((pkp) => pkp.appId === -1);

  // Show Vincent Yield modal when user has no Vincent Yield PKP
  if (isUserAuthed && !showVincentYieldModal && !hasUserDismissedModal && !vincentYieldPKP) {
    setShowVincentYieldModal(true);
  }

  // Show connect modal for unconnected PKPs (but not when there are no PKPs at all)
  if (
    isUserAuthed &&
    !showConnectModal &&
    unconnectedPKP &&
    !vincentYieldPKP &&
    permittedPKPs.length > 0
  ) {
    setShowConnectModal(true);
  }

  return (
    <>
      <PermittedAppsPage apps={filteredApps} permittedPKPs={permittedPKPs} />
      {showVincentYieldModal && !vincentYieldPKP && (
        <VincentYieldModal
          onClose={() => {
            setShowVincentYieldModal(false);
            setHasUserDismissedModal(true);
          }}
        />
      )}
      {showConnectModal && unconnectedPKP && (
        <ConnectToVincentYieldModal agentPKP={unconnectedPKP.pkp} />
      )}
    </>
  );
}
