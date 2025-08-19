import { useParams } from 'react-router';
import { ManagePagesSkeleton } from '../connect/ManagePagesSkeleton';
import { GeneralErrorScreen } from '../connect/GeneralErrorScreen';
import { AuthenticationErrorScreen } from '../connect/AuthenticationErrorScreen';
import { useConnectInfo } from '@/hooks/user-dashboard/connect/useConnectInfo';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { useUriPrecheck } from '@/hooks/user-dashboard/connect/useUriPrecheck';
import { BadRedirectUriError } from '@/components/user-dashboard/connect/BadRedirectUriError';
import { AppPermissionPage } from './UserPermissionPage';
import { useFetchUserPermissions } from '@/hooks/user-dashboard/dashboard/useFetchUserPermissions';
import { useAgentPKPForApp } from '@/hooks/user-dashboard/useAgentPKPForApp';
import { useUserPermissionsForApps } from '@/hooks/user-dashboard/dashboard/useUserPermissionsForApps';

export function UserPermissionWrapper() {
  const { appId } = useParams();
  const { authInfo, sessionSigs, isProcessing, error } = useReadAuthInfo();
  const { isLoading, isError, errors, data } = useConnectInfo(appId || '');

  const userAddress = authInfo?.userPKP?.ethAddress || '';

  // Get agent PKP for this specific app
  const {
    agentPKP,
    loading: agentPKPLoading,
    error: agentPKPError,
  } = useAgentPKPForApp(userAddress, appId ? Number(appId) : undefined);

  const {
    existingData,
    isLoading: isExistingDataLoading,
    error: isExistingDataError,
  } = useFetchUserPermissions({
    appId: Number(appId),
    pkpEthAddress: agentPKP?.ethAddress || '',
  });

  // Get permitted app versions for this user - only when we have the agentPKP
  const {
    permittedAppVersions,
    isLoading: permissionsLoading,
    error: permissionsError,
  } = useUserPermissionsForApps({
    agentPKPs: agentPKP ? [agentPKP] : [],
  });

  // Wait for permissions data to be loaded for this specific app
  const isPermissionsReady =
    agentPKP &&
    !permissionsLoading &&
    permittedAppVersions &&
    appId &&
    appId in permittedAppVersions;

  const { result: isRedirectUriAuthorized, redirectUri } = useUriPrecheck({
    authorizedRedirectUris: data?.app?.redirectUris,
  });

  // Wait for ALL critical data to load before making routing decisions
  const isUserAuthed = authInfo?.userPKP && sessionSigs;

  // Check if we have finished loading but got no data (invalid appId)
  const hasFinishedLoadingButNoData = !isLoading && !data;

  const isAllDataLoaded =
    data &&
    !isLoading &&
    !isProcessing &&
    // Only wait for permissions if user is authenticated
    (isUserAuthed ? !isExistingDataLoading && !agentPKPLoading && isPermissionsReady : true);

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
  if (
    isError ||
    error ||
    isExistingDataError ||
    agentPKPError ||
    (permissionsError && permissionsError !== 'Missing pkpTokenId')
  ) {
    const errorMessage =
      errors.length > 0
        ? errors.join(', ')
        : String(error ?? agentPKPError ?? permissionsError ?? 'An unknown error occurred');
    return <GeneralErrorScreen errorDetails={errorMessage} />;
  }

  return (
    <AppPermissionPage
      connectInfoMap={data}
      readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
      agentPKP={agentPKP!}
      existingData={existingData}
      permittedAppVersions={permittedAppVersions || {}}
    />
  );
}
