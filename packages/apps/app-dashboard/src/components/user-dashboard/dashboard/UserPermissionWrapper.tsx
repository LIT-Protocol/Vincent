import { useParams } from 'react-router';
import { ConnectPageSkeleton } from '../connect/ConnectPageSkeleton';
import { GeneralErrorScreen } from '../connect/GeneralErrorScreen';
import { AuthenticationErrorScreen } from '../connect/AuthenticationErrorScreen';
import { useConnectInfo } from '@/hooks/user-dashboard/connect/useConnectInfo';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { AppPermissionPage } from './UserPermissionPage';
import { useFetchUserPermissions } from '@/hooks/user-dashboard/dashboard/useFetchUserPermissions';
import { useUserPermissionsMiddleware } from '@/hooks/user-dashboard/dashboard/useUserPermissionsMiddleware';

export function UserPermissionWrapper() {
  const { appId } = useParams();
  const { authInfo, sessionSigs, isProcessing, error } = useReadAuthInfo();
  const { isLoading, isError, errors, data } = useConnectInfo(appId || '');
  const {
    existingData,
    isLoading: isExistingDataLoading,
    error: isExistingDataError,
  } = useFetchUserPermissions({
    appId: Number(appId),
    pkpEthAddress: authInfo?.agentPKP?.ethAddress || '',
  });

  // Get permitted app versions for this user
  const {
    permittedAppVersions,
    isLoading: permissionsLoading,
    error: permissionsError,
  } = useUserPermissionsMiddleware({
    pkpEthAddress: authInfo?.agentPKP?.ethAddress || '',
  });

  if (isProcessing) {
    return <ConnectPageSkeleton />;
  }

  const isUserAuthed = authInfo?.userPKP && authInfo?.agentPKP && sessionSigs;
  if (!isProcessing && !isUserAuthed) {
    return (
      <AuthenticationErrorScreen readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }} />
    );
  }

  if (isLoading || isExistingDataLoading || permissionsLoading) {
    return <ConnectPageSkeleton />;
  }

  if (
    isError ||
    error ||
    isExistingDataError ||
    (permissionsError && permissionsError !== 'Missing pkpTokenId')
  ) {
    const errorMessage =
      errors.length > 0
        ? errors.join(', ')
        : (error ?? permissionsError ?? 'An unknown error occurred');
    return <GeneralErrorScreen errorDetails={errorMessage} />;
  }

  return (
    <AppPermissionPage
      connectInfoMap={data}
      readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
      existingData={existingData}
      permittedAppVersions={permittedAppVersions || {}}
    />
  );
}
