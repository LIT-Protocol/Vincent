import { useParams } from 'react-router';
import { ConnectPage } from './ConnectPage';
import { UnifiedConnectSkeleton } from './UnifiedConnectSkeleton';
import { GeneralErrorScreen } from './GeneralErrorScreen';
import { BadRedirectUriError } from './BadRedirectUriError';
import { AuthConnectScreen } from './AuthConnectScreen';
import { useConnectInfo } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { useConnectMiddleware } from '@/hooks/user-dashboard/connect/useConnectMiddleware';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { ReturningUserConnect } from './ReturningUserConnect';
import { AppVersionNotInRegistryConnect } from './AppVersionNotInRegistry';
import { useUriPrecheck } from '@/hooks/user-dashboard/connect/useUriPrecheck';

export function ConnectPageWrapper() {
  const { appId } = useParams();

  const { authInfo, sessionSigs, isProcessing, error } = useReadAuthInfo();
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
    pkpEthAddress: authInfo?.agentPKPs?.[Number(appId)].ethAddress || '',
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

  let content;

  // Early return if required params are missing
  if (!appId) {
    content = <GeneralErrorScreen errorDetails="App ID was not provided" />;
  }

  // Wait for data to load first (but don't require sessionSigs for unauthenticated users)
  else if (!data) {
    content = <UnifiedConnectSkeleton mode="auth" />;
  }

  // Check for redirect URI validation errors immediately after we have data (highest priority)
  else if (isRedirectUriAuthorized === false && redirectUri) {
    content = (
      <BadRedirectUriError
        redirectUri={redirectUri || undefined}
        authorizedUris={data.app?.redirectUris}
      />
    );
  } else if (isLoading || isProcessing || isPermittedLoading) {
    // Check if we need auth skeleton or connect page skeleton
    const isUserAuthed = authInfo?.userPKP && sessionSigs;
    content = <UnifiedConnectSkeleton mode={isUserAuthed ? 'consent' : 'auth'} />;
  }

  // Wait for version data when we have a permitted version OR when user is permitted but version data is loading
  else if (
    (userPermittedVersion && versionDataLoading) ||
    (isPermitted === true && userPermittedVersion && !versionData)
  ) {
    content = <UnifiedConnectSkeleton mode="consent" />;
  } else {
    const isUserAuthed = authInfo?.userPKP && sessionSigs;

    // Now that we have data, check authentication
    if (!isUserAuthed) {
      content = (
        <AuthConnectScreen
          app={data.app}
          readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
        />
      );
    } else if (isError || error || isPermittedError || versionDataError) {
      const errorMessage =
        errors.length > 0
          ? errors.join(', ')
          : (error ??
            isPermittedError ??
            (versionDataError ? String(versionDataError) : undefined) ??
            'An unknown error occurred');
      content = <GeneralErrorScreen errorDetails={errorMessage} />;
    }
    // Check for unpublished app version BEFORE other permission checks
    else if (appExists === true && activeVersionExists === false) {
      content = (
        <AppVersionNotInRegistryConnect
          appData={data.app}
          readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
        />
      );
    } else if (isPermitted === true && userPermittedVersion && versionData) {
      content = (
        <ReturningUserConnect
          appData={data.app}
          version={userPermittedVersion}
          versionData={versionData}
          activeVersionData={activeVersionData}
          redirectUri={redirectUri || undefined}
          readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
        />
      );
    } else {
      content = (
        <ConnectPage
          connectInfoMap={data}
          readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
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
