import { useMemo, useState, useEffect } from 'react';
import { PermittedAppsPage } from './PermittedAppsPage';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { useReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { AuthenticationErrorScreen } from '../connect/AuthenticationErrorScreen';
import { GeneralErrorScreen } from '@/components/user-dashboard/connect/GeneralErrorScreen';
import { VincentYieldModal } from '../landing/VincentYieldModal';
import { ConnectToVincentYieldModal } from '../landing/ConnectToVincentYieldModal';
import { env } from '@/config/env';
import { useAllAgentApps } from '@/hooks/user-dashboard/useAllAgentApps';
import Loading from '@/components/shared/ui/Loading';
import { useFetchAppVersionsMap } from '@/hooks/user-dashboard/dashboard/useFetchAppVersionsMap';

type FilterState = 'permitted' | 'unpermitted' | 'deleted' | 'all';

export function PermittedAppsWrapper() {
  const readAuthInfo = useReadAuthInfo();
  const { authInfo, sessionSigs, isProcessing, error } = readAuthInfo;

  const userAddress = authInfo?.userPKP?.ethAddress || '';
  const [showVincentYieldModal, setShowVincentYieldModal] = useState(false);
  const [hasUserDismissedModal, setHasUserDismissedModal] = useState(false);
  const [filterState, setFilterState] = useState<FilterState>('permitted');

  // Fetch all agent app permissions
  const {
    permittedPkps,
    unpermittedPkps,
    loading: permissionsLoading,
    error: permissionsError,
  } = useAllAgentApps(userAddress);

  const { appVersionsMap } = useFetchAppVersionsMap({ userAddress });

  // Fetch all apps from the API
  const {
    data: allApps,
    isLoading: appsLoading,
    error: appsError,
    isSuccess: appsSuccess,
  } = vincentApiClient.useListAppsQuery();

  // Get permitted, unpermitted, and deleted apps
  const { permittedApps, unpermittedApps, deletedApps } = useMemo(() => {
    if (!allApps) return { permittedApps: [], unpermittedApps: [], deletedApps: [] };

    // Build sets of appIds for each category in a single pass
    const permittedAppIds = new Set<number>();
    const unpermittedAppIds = new Set<number>();
    const deletedAppIds = new Set<number>();

    permittedPkps.forEach((p) => {
      if (p.isDeleted) {
        deletedAppIds.add(p.appId);
      } else {
        permittedAppIds.add(p.appId);
      }
    });

    unpermittedPkps.forEach((p) => {
      if (p.isDeleted) {
        deletedAppIds.add(p.appId);
      } else {
        unpermittedAppIds.add(p.appId);
      }
    });

    // Categorize apps in a single pass
    const permitted: typeof allApps = [];
    const unpermitted: typeof allApps = [];
    const deleted: typeof allApps = [];

    allApps.forEach((app) => {
      if (deletedAppIds.has(app.appId)) {
        deleted.push(app);
      } else if (permittedAppIds.has(app.appId)) {
        permitted.push(app);
      } else if (unpermittedAppIds.has(app.appId)) {
        unpermitted.push(app);
      }
    });

    return { permittedApps: permitted, unpermittedApps: unpermitted, deletedApps: deleted };
  }, [allApps, permittedPkps, unpermittedPkps]);

  // Filter apps based on filter state
  const filteredApps = useMemo(() => {
    switch (filterState) {
      case 'permitted':
        return permittedApps;
      case 'unpermitted':
        return unpermittedApps;
      case 'deleted':
        return deletedApps;
      case 'all':
        return [...permittedApps, ...unpermittedApps, ...deletedApps];
      default:
        return permittedApps;
    }
  }, [permittedApps, unpermittedApps, deletedApps, filterState]);

  const isUserAuthed = authInfo?.userPKP && sessionSigs;

  // Check if Vincent Yield app is permitted or unpermitted (i.e., user has any connection to it)
  const vincentYieldAppId = Number(env.VITE_VINCENT_YIELD_APPID);
  const hasVincentYieldPerms =
    permittedPkps.some((p) => p.appId === vincentYieldAppId) ||
    unpermittedPkps.some((p) => p.appId === vincentYieldAppId);

  // Find PKPs with appId = -1 (unconnected PKPs - for migration)
  const unconnectedPKP = permittedPkps.find((pkp) => pkp.appId === -1);

  // Show Vincent Yield modal if user is authenticated but doesn't have permissions
  useEffect(() => {
    if (isUserAuthed && !hasUserDismissedModal) {
      if (!hasVincentYieldPerms && !showVincentYieldModal) {
        setShowVincentYieldModal(true);
      } else if (hasVincentYieldPerms && showVincentYieldModal) {
        // Close modal if Vincent Yield perms are now detected
        setShowVincentYieldModal(false);
      }
    }
  }, [isUserAuthed, hasVincentYieldPerms, showVincentYieldModal, hasUserDismissedModal]);

  // Show loading while auth is processing
  if (isProcessing) {
    return <Loading />;
  }

  // Handle auth errors early
  if (error) {
    return <AuthenticationErrorScreen readAuthInfo={readAuthInfo} />;
  }

  // Handle missing auth or user address
  if (!userAddress) {
    return <Loading />;
  }

  // Show loading while data is being fetched
  if (permissionsLoading || appsLoading || !appsSuccess) {
    return <Loading />;
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
        appVersionsMap={appVersionsMap}
      />
      {showVincentYieldModal && unconnectedPKP ? (
        <ConnectToVincentYieldModal
          agentPKP={unconnectedPKP.pkp}
          onClose={() => {
            setShowVincentYieldModal(false);
            setHasUserDismissedModal(true);
          }}
        />
      ) : showVincentYieldModal ? (
        <VincentYieldModal
          onClose={() => {
            setShowVincentYieldModal(false);
            setHasUserDismissedModal(true);
          }}
        />
      ) : null}
    </>
  );
}
