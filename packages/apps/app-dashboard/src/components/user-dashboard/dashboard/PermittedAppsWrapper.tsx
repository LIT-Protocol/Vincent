import React, { useMemo, useState } from 'react';
import { PermittedAppsPage } from './PermittedAppsPage';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { PermittedAppsSkeleton } from './PermittedAppsSkeleton';
import { useReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { AuthenticationErrorScreen } from '../connect/AuthenticationErrorScreen';
import { GeneralErrorScreen } from '@/components/user-dashboard/connect/GeneralErrorScreen';
import { VincentYieldModal } from '../landing/VincentYieldModal';
import { ConnectToVincentYieldModal } from '../landing/ConnectToVincentYieldModal';
import { env } from '@/config/env';
import { useAllAgentApps } from '@/hooks/user-dashboard/useAllAgentApps';

type FilterState = 'permitted' | 'unpermitted' | 'all';

export function PermittedAppsWrapper() {
  const readAuthInfo = useReadAuthInfo();
  const { authInfo, sessionSigs, isProcessing, error } = readAuthInfo;

  const userAddress = authInfo?.userPKP?.ethAddress || '';
  const [showVincentYieldModal, setShowVincentYieldModal] = useState(false);
  const [hasUserDismissedModal, setHasUserDismissedModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [filterState, setFilterState] = useState<FilterState>('permitted');

  // Fetch all agent app permissions
  const {
    permittedPkps,
    unpermittedPkps,
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

  // Get permitted and unpermitted apps
  const { permittedApps, unpermittedApps } = useMemo(() => {
    if (!allApps) return { permittedApps: [], unpermittedApps: [] };

    const permittedAppIds = new Set(permittedPkps.map((p) => p.appId));
    const unpermittedAppIds = new Set(unpermittedPkps.map((p) => p.appId));

    const permitted = allApps.filter((app) => permittedAppIds.has(app.appId));
    const unpermitted = allApps.filter((app) => unpermittedAppIds.has(app.appId));

    return { permittedApps: permitted, unpermittedApps: unpermitted };
  }, [allApps, permittedPkps, unpermittedPkps]);

  // Filter apps based on filter state
  const filteredApps = useMemo(() => {
    switch (filterState) {
      case 'permitted':
        return permittedApps;
      case 'unpermitted':
        return unpermittedApps;
      case 'all':
        return [...permittedApps, ...unpermittedApps];
      default:
        return permittedApps;
    }
  }, [permittedApps, unpermittedApps, filterState]);

  const isUserAuthed = authInfo?.userPKP && sessionSigs;

  // Find the agent PKP that's permitted for Vincent Yield
  const vincentYieldPKP = permittedPkps.find(
    (pkp) => pkp.appId === Number(env.VITE_VINCENT_YIELD_APPID),
  );

  // Find PKPs with appId = -1 (unconnected PKPs)
  const unconnectedPKP = permittedPkps.find((pkp) => pkp.appId === -1);

  // Show Vincent Yield modal when user has no Vincent Yield PKP
  React.useEffect(() => {
    if (isUserAuthed && !showVincentYieldModal && !hasUserDismissedModal && !vincentYieldPKP) {
      setShowVincentYieldModal(true);
    }
  }, [isUserAuthed, showVincentYieldModal, hasUserDismissedModal, vincentYieldPKP]);

  // Show connect modal for unconnected PKPs (but not when there are no PKPs at all)
  React.useEffect(() => {
    if (
      isUserAuthed &&
      !showConnectModal &&
      unconnectedPKP &&
      !vincentYieldPKP &&
      permittedPkps.length > 0
    ) {
      setShowConnectModal(true);
    }
  }, [isUserAuthed, showConnectModal, unconnectedPKP, vincentYieldPKP, permittedPkps.length]);

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
    return <GeneralErrorScreen errorDetails={String(error)} />;
  }

  if (!isUserAuthed) {
    return <AuthenticationErrorScreen readAuthInfo={readAuthInfo} />;
  }

  return (
    <>
      <PermittedAppsPage
        apps={filteredApps}
        permittedPkps={permittedPkps}
        unpermittedPkps={unpermittedPkps}
        filterState={filterState}
        setFilterState={setFilterState}
      />
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
