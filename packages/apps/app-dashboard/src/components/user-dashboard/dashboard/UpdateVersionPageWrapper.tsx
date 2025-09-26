import { useParams } from 'react-router';
import * as Sentry from '@sentry/react';
import { UpdateVersionPage } from './UpdateVersionPage';
import { ManagePagesSkeleton } from '../connect/ManagePagesSkeleton';
import { GeneralErrorScreen } from '@/components/user-dashboard/connect/GeneralErrorScreen';
import { AuthenticationErrorScreen } from '@/components/user-dashboard/connect/AuthenticationErrorScreen';
import { useConnectInfo } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { useCheckAppVersionExists } from '@/hooks/user-dashboard/connect/useCheckAppVersionExists';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { useUriPrecheck } from '@/hooks/user-dashboard/connect/useUriPrecheck';
import { BadRedirectUriError } from '@/components/user-dashboard/connect/BadRedirectUriError';
import { AppVersionNotInRegistryUpdate } from './AppVersionNotInRegistryUpdate';
import { useAgentPkpForApp } from '@/hooks/user-dashboard/useAgentPkpForApp';

export function UpdateVersionPageWrapper() {
  const { appId } = useParams();

  const { authInfo, sessionSigs, isProcessing, error } = useReadAuthInfo();
  const { isLoading, isError, errors, data } = useConnectInfo(appId || '');

  const userAddress = authInfo?.userPKP?.ethAddress || '';

  // Get agent PKP for this specific app
  const {
    agentPKP,
    loading: agentPKPLoading,
    error: agentPKPError,
  } = useAgentPkpForApp(userAddress, appId ? Number(appId) : undefined);

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

  const { result: isRedirectUriAuthorized, redirectUri } = useUriPrecheck({
    authorizedRedirectUris: data?.app?.redirectUris,
  });

  // Early return if required params are missing
  if (!appId) {
    return <GeneralErrorScreen errorDetails="App ID was not provided" />;
  }

  // Wait for ALL critical data to load before making routing decisions
  const isUserAuthed = authInfo?.userPKP && sessionSigs;

  // Check if we have finished loading but got no data (invalid appId)
  const hasFinishedLoadingButNoData = !isLoading && !data;

  const isAllDataLoaded =
    data &&
    !isLoading &&
    !isProcessing &&
    // Only wait for version check and agent PKP if user is authenticated
    (isUserAuthed ? !isVersionCheckLoading && !agentPKPLoading && agentPKP : true);

  // Authentication check - must be done before other business logic
  if (!isProcessing && !isUserAuthed) {
    return (
      <AuthenticationErrorScreen readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }} />
    );
  }

  // Check for invalid appId first (finished loading but no data OR has error)
  if (hasFinishedLoadingButNoData || (isError && errors.length > 0)) {
    const errorMessage =
      isError && errors.length > 0 ? errors.join(', ') : `App with ID ${appId} not found`;
    const error = new Error(errorMessage);
    Sentry.captureException(error);
    return <GeneralErrorScreen errorDetails={errorMessage} />;
  }

  if (!isAllDataLoaded) {
    return <ManagePagesSkeleton />;
  }

  // Check for redirect URI validation errors (highest priority)
  if (isRedirectUriAuthorized === false && redirectUri) {
    return (
      <BadRedirectUriError
        redirectUri={redirectUri || undefined}
        authorizedUris={data?.app?.redirectUris}
      />
    );
  }

  // Check for any errors
  if (isError || error || isVersionCheckError || agentPKPError) {
    const errorMessage =
      errors.length > 0
        ? errors.join(', ')
        : String(error ?? isVersionCheckError ?? agentPKPError ?? 'An unknown error occurred');
    const errorToLog = agentPKPError || isVersionCheckError || error || new Error(errorMessage);
    Sentry.captureException(errorToLog);
    return <GeneralErrorScreen errorDetails={errorMessage} />;
  }

  // Check for unpublished app version
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
      agentPKP={agentPKP!}
    />
  );
}
