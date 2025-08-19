import { useParams } from 'react-router';
import { ConnectPage } from './ConnectPage';
import { UnifiedConnectSkeleton } from './UnifiedConnectSkeleton';
import { GeneralErrorScreen } from './GeneralErrorScreen';
import { BadRedirectUriError } from './BadRedirectUriError';
import { AuthConnectScreen } from './AuthConnectScreen';
import { useConnectInfo } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { useConnectMiddleware } from '@/hooks/user-dashboard/connect/useConnectMiddleware';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { useAgentPKPForApp } from '@/hooks/user-dashboard/useAgentPKPForApp';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { ReturningUserConnect } from './ReturningUserConnect';
import { AppVersionNotInRegistryConnect } from './AppVersionNotInRegistry';
import { useUriPrecheck } from '@/hooks/user-dashboard/connect/useUriPrecheck';

export function ConnectPageWrapper() {
  const { appId } = useParams();

  const { authInfo, sessionSigs, isProcessing, error } = useReadAuthInfo();
  const {
    agentPKP,
    isLastUnpermittedPKP,
    loading: agentPKPLoading,
    error: agentPKPError,
  } = useAgentPKPForApp(authInfo?.userPKP?.ethAddress, appId ? Number(appId) : undefined);
  const { isLoading, isError, errors, data } = useConnectInfo(appId || '');
  const {
    isPermitted,
    appExists,
    activeVersionExists,
    userPermittedVersion,
    isLoading: isPermittedLoading,
    error: isPermittedError,
  } = useConnectMiddleware({
    appId: Number(appId),
    pkpEthAddress: agentPKP?.ethAddress || '',
    appData: data?.app,
  });

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
      version: userPermittedVersion || 0,
    },
    {
      skip: !userPermittedVersion, // Only fetch if user has a permitted version
    },
  );

  // Find active version data from existing app versions
  const activeVersionData = data?.app?.activeVersion
    ? data.versionsByApp[appId!]?.find((v) => v.version === data.app.activeVersion)
    : undefined;

  // Wait for ALL critical data to load before making routing decisions
  const isUserAuthed = authInfo?.userPKP && sessionSigs;

  // Check if we have finished loading but got no data (invalid appId)
  const hasFinishedLoadingButNoData = !isLoading && !data;

  const isAllDataLoaded =
    data &&
    !isLoading &&
    !isProcessing &&
    // Only wait for permissions and agent PKP if user is authenticated
    (isUserAuthed ? !isPermittedLoading && !agentPKPLoading && agentPKP : true) &&
    (!userPermittedVersion || !versionDataLoading);

  // Now make routing decisions with complete information
  let content;

  // Check for invalid appId first (finished loading but no data OR has error)
  if (hasFinishedLoadingButNoData || (isError && errors.length > 0)) {
    const errorMessage =
      isError && errors.length > 0 ? errors.join(', ') : `App with ID ${appId} not found`;
    content = <GeneralErrorScreen errorDetails={errorMessage} />;
  } else if (!isAllDataLoaded) {
    content = <UnifiedConnectSkeleton mode={isUserAuthed ? 'consent' : 'auth'} />;
  } else if (isRedirectUriAuthorized === false && redirectUri) {
    content = (
      <BadRedirectUriError
        redirectUri={redirectUri || undefined}
        authorizedUris={data.app?.redirectUris}
      />
    );
  }
  // Check for unpublished app version
  else if (appExists === true && activeVersionExists === false && isPermitted !== true) {
    content = (
      <AppVersionNotInRegistryConnect
        appData={data.app}
        readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
      />
    );
  }
  // Check for any errors
  else if (isError || error || isPermittedError || versionDataError || agentPKPError) {
    const errorMessage =
      errors.length > 0
        ? errors.join(', ')
        : (error ??
          isPermittedError ??
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
    else if (isPermitted === true && userPermittedVersion && versionData) {
      content = (
        <ReturningUserConnect
          appData={data.app}
          version={userPermittedVersion}
          versionData={versionData}
          activeVersionData={activeVersionData}
          redirectUri={redirectUri || undefined}
          readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
          agentPKP={agentPKP!}
        />
      );
    }
    // Default to connect page
    else {
      content = (
        <ConnectPage
          connectInfoMap={data}
          readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
          agentPKP={agentPKP!}
          isLastUnpermittedPKP={isLastUnpermittedPKP}
        />
      );
    }
  }

  return (
    <div className="min-h-screen w-full transition-colors duration-500 p-2 sm:p-4 md:p-6 relative flex justify-center items-start pt-24 sm:pt-28 md:pt-32 lg:pt-40 overflow-hidden">
      {/* Left SVG - positioned from left */}
      <div
        className="absolute top-0 left-0 w-[600px] h-[600px] z-0"
        style={{
          backgroundImage: `url('/connect-static-left.svg')`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
        }}
      ></div>

      {/* Right SVG - positioned from right */}
      <div
        className="absolute top-0 z-0"
        style={{
          left: 'max(600px, calc(100vw - 600px))',
          width: '600px',
          height: '600px',
          backgroundImage: `url('/connect-static-right.svg')`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
        }}
      ></div>

      {content}
    </div>
  );
}
