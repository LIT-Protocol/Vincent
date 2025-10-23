import { useState } from 'react';
import { useParams } from 'react-router';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';

import { AppUnavailableConnect } from './AppUnavailableConnect';
import { AppVersionNotInRegistryConnect } from './AppVersionNotInRegistry';
import { AuthConnectScreen } from './AuthConnectScreen';
import { BadRedirectUriError } from './BadRedirectUriError';
import { ConnectPage } from './ConnectPage';
import { DisabledVersionConnect } from './DisabledVersionConnect';
import { EditPermissionsCard } from './EditPermissionsCard';
import { GeneralErrorScreen } from './GeneralErrorScreen';
import { RepermitConnect } from './RepermitConnect';
import { ReturningUserConnect } from './ReturningUserConnect';
import { UnifiedConnectSkeleton } from './UnifiedConnectSkeleton';
import { UpdateVersionCard } from './UpdateVersionCard';
import { useCheckAppVersionExists } from '@/hooks/user-dashboard/connect/useCheckAppVersionExists';
import { useConnectInfo } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { useUriPrecheck } from '@/hooks/user-dashboard/connect/useUriPrecheck';
import { useFetchUserPermissions } from '@/hooks/user-dashboard/dashboard/useFetchUserPermissions';
import { useAgentPkpForApp } from '@/hooks/user-dashboard/useAgentPkpForApp';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';

type ViewMode = 'consent' | 'edit-permissions' | 'update-version';

export function ConnectPageWrapper() {
  const { appId } = useParams();
  const [viewMode, setViewMode] = useState<ViewMode>('consent');

  const { authInfo, sessionSigs, isProcessing, error } = useReadAuthInfo();
  const {
    agentPKP,
    permittedVersion,
    versionEnabled,
    loading: agentPKPLoading,
    error: agentPKPError,
  } = useAgentPkpForApp(authInfo?.userPKP?.ethAddress, appId ? Number(appId) : undefined);

  const versionsToFetch =
    viewMode === 'edit-permissions' && permittedVersion ? [permittedVersion] : undefined;
  const useActiveVersion = viewMode !== 'edit-permissions';

  const { isLoading, isError, errors, data } = useConnectInfo(
    appId || '',
    versionsToFetch,
    useActiveVersion,
  );
  const {
    appExists,
    activeVersionExists,
    isLoading: isVersionCheckLoading,
    error: isVersionCheckError,
  } = useCheckAppVersionExists({
    appId: Number(appId),
    pkpEthAddress: agentPKP?.ethAddress || '',
    appData: data?.app,
  });

  // Derive isPermitted from permittedVersion
  const isPermitted = permittedVersion !== null;

  // When there's no agentPKP, override the version check loading state
  const actualIsVersionCheckLoading = !agentPKP && !agentPKPLoading ? false : isVersionCheckLoading;

  const { result: isRedirectUriAuthorized, redirectUri } = useUriPrecheck({
    authorizedRedirectUris: data?.app?.redirectUris,
  });

  // Fetch version data for returning users to check if version is disabled
  const {
    data: versionData,
    isLoading: versionDataLoading,
    error: versionDataError,
  } = vincentApiClient.useGetAppVersionQuery(
    {
      appId: Number(appId),
      version: permittedVersion || 0,
    },
    {
      skip: !permittedVersion, // Only fetch if user has a permitted version
    },
  );

  // Find active version data from existing app versions
  const activeVersionData = data?.app?.activeVersion
    ? data.versionsByApp[appId!]?.find((v) => v.version === data.app.activeVersion)
    : undefined;

  // Fetch user permissions data (only when user is permitted and editing permissions)
  const { existingData, isLoading: isExistingDataLoading } = useFetchUserPermissions({
    appId: Number(appId),
    pkpEthAddress: agentPKP?.ethAddress || '',
  });

  // Wait for ALL critical data to load before making routing decisions
  const isUserAuthed = authInfo?.userPKP && sessionSigs;

  // Check if we have finished loading but got no data (invalid appId)
  const hasFinishedLoadingButNoData = !isLoading && !data;

  const isAllDataLoaded =
    data &&
    !isLoading &&
    !isProcessing &&
    // Only wait for version check and agent PKP loading if user is authenticated
    (isUserAuthed ? !actualIsVersionCheckLoading && !agentPKPLoading : true) &&
    (!permittedVersion || !versionDataLoading) &&
    // When showing edit permissions, also wait for permissions data
    (viewMode !== 'edit-permissions' || !isExistingDataLoading);

  // Now make routing decisions with complete information
  let content;

  // Check for invalid appId first (finished loading but no data OR has error)
  if (hasFinishedLoadingButNoData || (isError && errors.length > 0)) {
    const errorMessage =
      isError && errors.length > 0 ? errors.join(', ') : `App with ID ${appId} not found`;
    content = <GeneralErrorScreen errorDetails={errorMessage} />;
  } else if (!isAllDataLoaded) {
    content = <UnifiedConnectSkeleton mode={isUserAuthed ? 'consent' : 'auth'} />;
  } else if (!redirectUri) {
    content = (
      <GeneralErrorScreen errorDetails="No redirect URI provided. This page is for app authentication flow only." />
    );
  } else if (isRedirectUriAuthorized === false) {
    content = (
      <BadRedirectUriError redirectUri={redirectUri} authorizedUris={data.app?.redirectUris} />
    );
  }
  // Check for unpublished app version (check this early, before auth)
  else if (!data.app?.activeVersion) {
    // App has no active version set (version 1 not published)
    content = (
      <AppVersionNotInRegistryConnect
        appData={data.app}
        readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
        hasActiveVersion={false}
      />
    );
  }
  // Check for unpublished app version (active version set but not on chain)
  else if (appExists === true && activeVersionExists === false && isPermitted !== true) {
    content = (
      <AppVersionNotInRegistryConnect
        appData={data.app}
        readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
        hasActiveVersion={true}
      />
    );
  }
  // Check for any errors
  else if (isError || error || isVersionCheckError || versionDataError || agentPKPError) {
    const errorMessage =
      errors.length > 0
        ? errors.join(', ')
        : (error ??
          isVersionCheckError ??
          agentPKPError?.message ??
          (versionDataError ? String(versionDataError) : undefined) ??
          'An unknown error occurred');
    content = <GeneralErrorScreen errorDetails={errorMessage} />;
  } else {
    // Check authentication
    if (!isUserAuthed) {
      content = (
        <AuthConnectScreen
          app={data.app}
          readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
        />
      );
    }
    // Check for existing user permissions
    else if (isPermitted === true && permittedVersion && versionData) {
      // Toggle between consent, edit permissions, and update version views
      if (viewMode === 'edit-permissions') {
        content = (
          <EditPermissionsCard
            connectInfoMap={data}
            readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
            agentPKP={agentPKP!}
            existingData={existingData}
            permittedVersion={permittedVersion}
            redirectUri={redirectUri}
            onBackToConsent={() => setViewMode('consent')}
          />
        );
      } else if (viewMode === 'update-version') {
        content = (
          <UpdateVersionCard
            connectInfoMap={data}
            readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
            agentPKP={agentPKP!}
            currentVersion={permittedVersion}
            redirectUri={redirectUri}
            onBackToConsent={() => setViewMode('consent')}
          />
        );
      } else {
        content = (
          <ReturningUserConnect
            appData={data.app}
            version={permittedVersion}
            versionData={versionData}
            activeVersionData={activeVersionData}
            readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
            agentPKP={agentPKP!}
            onEditPermissions={() => setViewMode('edit-permissions')}
            onUpdateVersion={() => setViewMode('update-version')}
          />
        );
      }
    }
    // Check if both user's version and active version are disabled - app is unavailable
    else if (
      agentPKP &&
      !isPermitted &&
      versionEnabled === false &&
      activeVersionData &&
      !activeVersionData.enabled
    ) {
      content = (
        <AppUnavailableConnect
          appData={data.app}
          readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
          activeVersion={data.app?.activeVersion}
        />
      );
    }
    // Check for previously permitted PKP with disabled version (but active version is available)
    else if (agentPKP && !isPermitted && versionEnabled === false) {
      content = (
        <DisabledVersionConnect
          appData={data.app}
          readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
          connectInfoMap={data}
        />
      );
    }
    // Check for previously permitted PKP (unpermitted but has PKP - only if it was actually previously permitted)
    else if (agentPKP && !isPermitted && versionEnabled !== null) {
      content = (
        <RepermitConnect
          appData={data.app}
          previouslyPermittedPKP={agentPKP}
          readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
          redirectUri={redirectUri || undefined}
        />
      );
    }
    // Check for existing PKP that was never permitted for this app (reuse it)
    else if (agentPKP && !isPermitted) {
      content = (
        <ConnectPage
          connectInfoMap={data}
          readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
          previouslyPermittedPKP={agentPKP}
        />
      );
    }
    // Default to connect page (will mint new PKP)
    else {
      content = (
        <ConnectPage
          connectInfoMap={data}
          readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
        />
      );
    }
  }

  return (
    <div className="w-full transition-colors duration-500 p-2 sm:p-4 md:p-6 relative flex justify-center items-start pt-16 sm:pt-20 md:pt-24 lg:pt-28">
      {content}
    </div>
  );
}
