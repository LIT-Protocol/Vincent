import { useParams } from 'react-router';
import Loading from '@/components/shared/ui/Loading';
import { GeneralErrorScreen } from '../connect/GeneralErrorScreen';
import { DeletedAppErrorScreen } from '../connect/DeletedAppErrorScreen';
import { AuthenticationErrorScreen } from '../connect/AuthenticationErrorScreen';
import { useConnectInfo } from '@/hooks/user-dashboard/connect/useConnectInfo';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { useUriPrecheck } from '@/hooks/user-dashboard/connect/useUriPrecheck';
import { BadRedirectUriError } from '@/components/user-dashboard/connect/BadRedirectUriError';
import { AppPermissionPage } from './UserPermissionPage';
import { useFetchUserPermissions } from '@/hooks/user-dashboard/dashboard/useFetchUserPermissions';
import { useAgentPkpForApp } from '@/hooks/user-dashboard/useAgentPkpForApp';
import { useFetchAppVersionsMap } from '@/hooks/user-dashboard/dashboard/useFetchAppVersionsMap';

export function UserPermissionWrapper() {
  const { appId } = useParams();
  const { authInfo, sessionSigs, isProcessing, error } = useReadAuthInfo();

  const userAddress = authInfo?.userPKP?.ethAddress || '';

  // Get agent PKP for this specific app
  const {
    agentPKP,
    permittedVersion,
    loading: agentPKPLoading,
    error: agentPKPError,
  } = useAgentPkpForApp(userAddress, appId ? Number(appId) : undefined);

  const { appVersionsMap } = useFetchAppVersionsMap({ userAddress });

  const {
    existingData,
    isLoading: isExistingDataLoading,
    error: isExistingDataError,
  } = useFetchUserPermissions({
    appId: Number(appId),
    pkpEthAddress: agentPKP?.ethAddress || '',
  });

  const versionsToFetch = permittedVersion ? [permittedVersion] : undefined;

  // CRITICAL: When user has permissions, we MUST fetch their permitted version's policy data
  // When user has NO permissions, fetch active version just to check if app is deleted
  const useActiveVersion = permittedVersion === null;
  const { isLoading, isError, errors, data } = useConnectInfo(
    appId || '',
    versionsToFetch,
    useActiveVersion,
  );

  // Wait for permissions data to be loaded for this specific app
  const isPermissionsReady = agentPKP && permittedVersion !== null;

  const { result: isRedirectUriAuthorized, redirectUri } = useUriPrecheck({
    authorizedRedirectUris: data?.app?.redirectUris,
  });

  // Wait for ALL critical data to load before making routing decisions
  const isUserAuthed = authInfo?.userPKP && sessionSigs;

  // Authentication check - must be done before other business logic
  if (!isProcessing && !isUserAuthed) {
    return (
      <AuthenticationErrorScreen readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }} />
    );
  }

  // Check for invalid appId first (finished loading but no data OR has error)
  const hasFinishedLoadingButNoData = !isLoading && !data;
  if (hasFinishedLoadingButNoData || (isError && errors.length > 0)) {
    const errorMessage =
      isError && errors.length > 0 ? errors.join(', ') : `App with ID ${appId} not found`;
    return <GeneralErrorScreen errorDetails={errorMessage} />;
  }

  // Early check for deleted apps - show deleted screen as soon as we have basic app data
  if (data?.app?.isDeleted && !isLoading && !isProcessing && !agentPKPLoading) {
    const hasPermission = permittedVersion !== null;
    return (
      <DeletedAppErrorScreen
        appData={data.app}
        hasPermission={hasPermission}
        agentPKP={agentPKP || undefined}
        permittedVersion={permittedVersion}
        readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
      />
    );
  }

  // For non-deleted apps, wait for all permissions data to be loaded
  const isAllDataLoaded =
    data &&
    !isLoading &&
    !isProcessing &&
    (isUserAuthed ? !isExistingDataLoading && !agentPKPLoading && isPermissionsReady : true);

  if (!isAllDataLoaded) {
    return <Loading />;
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
  if (isError || error || isExistingDataError || agentPKPError) {
    const errorMessage =
      errors.length > 0
        ? errors.join(', ')
        : String(error ?? agentPKPError ?? 'An unknown error occurred');
    return <GeneralErrorScreen errorDetails={errorMessage} />;
  }

  return (
    <AppPermissionPage
      connectInfoMap={data}
      readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
      agentPKP={agentPKP!}
      existingData={existingData}
      permittedAppVersions={
        appId && permittedVersion ? { [appId]: permittedVersion.toString() } : {}
      }
      appVersionsMap={appVersionsMap}
    />
  );
}
