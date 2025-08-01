import { useParams } from 'react-router';
import { ConnectPage } from './ConnectPage';
import { ConnectPageSkeleton } from './ConnectPageSkeleton';
import { GeneralErrorScreen } from './GeneralErrorScreen';
import { BadRedirectUriError } from './BadRedirectUriError';
import { AuthConnectScreen } from './AuthConnectScreen';
import { useConnectInfo } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { useConnectMiddleware } from '@/hooks/user-dashboard/connect/useConnectMiddleware';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
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
    pkpEthAddress: authInfo?.agentPKP?.ethAddress || '',
    appData: data?.app,
  });

  const {
    result: isRedirectUriAuthorized,
    error: redirectUriError,
    redirectUri,
  } = useUriPrecheck({
    authorizedRedirectUris: data?.app?.redirectUris,
  });

  // Early return if required params are missing
  if (!appId) {
    return <GeneralErrorScreen errorDetails="App ID was not provided" />;
  }

  // Wait for data to load first (but don't require sessionSigs for unauthenticated users)
  if (!data) {
    return <ConnectPageSkeleton />;
  }

  if (isLoading || isProcessing || isPermittedLoading) {
    return <ConnectPageSkeleton />;
  }

  // Check for redirect URI validation errors
  if (isRedirectUriAuthorized === false || redirectUriError) {
    return (
      <BadRedirectUriError
        redirectUri={redirectUri || undefined}
        authorizedUris={data.app?.redirectUris}
      />
    );
  }

  const isUserAuthed = authInfo?.userPKP && authInfo?.agentPKP && sessionSigs;

  // Now that we have data, check authentication
  if (!isUserAuthed) {
    return (
      <AuthConnectScreen
        app={data.app}
        readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
      />
    );
  }

  if (isError || error || isPermittedError) {
    const errorMessage =
      errors.length > 0
        ? errors.join(', ')
        : (error ?? isPermittedError ?? 'An unknown error occurred');
    return <GeneralErrorScreen errorDetails={errorMessage} />;
  }

  if (appExists === true && activeVersionExists === false) {
    return (
      <AppVersionNotInRegistryConnect
        appData={data.app}
        readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
      />
    );
  }

  if (isPermitted === true && userPermittedVersion) {
    return (
      <ReturningUserConnect
        appData={data.app}
        version={userPermittedVersion}
        readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
      />
    );
  }

  return (
    <ConnectPage
      connectInfoMap={data}
      readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
    />
  );
}
