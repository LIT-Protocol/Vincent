import { useParams } from 'react-router';
import { UpdateVersionPage } from './UpdateVersionPage';
import { ManagePagesSkeleton } from '../connect/ManagePagesSkeleton';
import { GeneralErrorScreen } from '@/components/user-dashboard/connect/GeneralErrorScreen';
import { AuthenticationErrorScreen } from '@/components/user-dashboard/connect/AuthenticationErrorScreen';
import { useConnectInfo } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { useConnectMiddleware } from '@/hooks/user-dashboard/connect/useConnectMiddleware';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { useUriPrecheck } from '@/hooks/user-dashboard/connect/useUriPrecheck';
import { BadRedirectUriError } from '@/components/user-dashboard/connect/BadRedirectUriError';
import { AppVersionNotInRegistryUpdate } from './AppVersionNotInRegistryUpdate';

export function UpdateVersionPageWrapper() {
  const { appId } = useParams();

  const { authInfo, sessionSigs, isProcessing, error } = useReadAuthInfo();
  const { isLoading, isError, errors, data } = useConnectInfo(appId || '');
  const {
    appExists,
    activeVersionExists,
    isLoading: isPermittedLoading,
    error: isPermittedError,
  } = useConnectMiddleware({
    appId: Number(appId),
    pkpEthAddress: authInfo?.agentPKPs?.[Number(appId)]?.ethAddress || '',
    appData: data?.app,
  });

  const { result: isRedirectUriAuthorized, redirectUri } = useUriPrecheck({
    authorizedRedirectUris: data?.app?.redirectUris,
  });

  // Early return if required params are missing
  if (!appId) {
    return <GeneralErrorScreen errorDetails="App ID was not provided" />;
  }

  const isUserAuthed = authInfo?.userPKP && sessionSigs;
  if (!isProcessing && !isUserAuthed) {
    return (
      <AuthenticationErrorScreen readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }} />
    );
  }

  if (isLoading || isProcessing || isPermittedLoading) {
    return <ManagePagesSkeleton />;
  }

  // Check for redirect URI validation errors (only when redirectUri is provided but invalid)
  if (isRedirectUriAuthorized === false && redirectUri) {
    return (
      <BadRedirectUriError
        redirectUri={redirectUri || undefined}
        authorizedUris={data?.app?.redirectUris}
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

  if (!data || !authInfo || !sessionSigs) {
    return <ManagePagesSkeleton />;
  }

  if (appExists === true && activeVersionExists === false) {
    return (
      <AppVersionNotInRegistryUpdate
        appData={data.app}
        readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
      />
    );
  }

  return (
    <UpdateVersionPage
      connectInfoMap={data}
      readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
    />
  );
}
