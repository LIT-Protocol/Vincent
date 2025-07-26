import { useParams } from 'react-router';
import { ConsentPageSkeleton } from '../consent/ConsentPageSkeleton';
import { GeneralErrorScreen } from '../consent/GeneralErrorScreen';
import { AuthenticationErrorScreen } from '../consent/AuthenticationErrorScreen';
import { useConsentInfo } from '@/hooks/user-dashboard/consent/useConsentInfo';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { AppPermissionPage } from './UserPermissionPage';
import { useFetchUserPermissions } from '@/hooks/user-dashboard/dashboard/useFetchUserPermissions';
import { useUserPermissionsMiddleware } from '@/hooks/user-dashboard/dashboard/useUserPermissionsMiddleware';

export function UserPermissionWrapper() {
  const { appId } = useParams();
  const { authInfo, sessionSigs, isProcessing, error } = useReadAuthInfo();
  const { isLoading, isError, errors, data } = useConsentInfo(appId || '');
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
    return <ConsentPageSkeleton />;
  }

  const isUserAuthed = authInfo?.userPKP && authInfo?.agentPKP && sessionSigs;
  if (!isProcessing && !isUserAuthed) {
    return (
      <AuthenticationErrorScreen readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }} />
    );
  }

  if (isLoading || isExistingDataLoading || permissionsLoading) {
    return <ConsentPageSkeleton />;
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
      consentInfoMap={data}
      readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
      existingData={existingData}
      permittedAppVersions={permittedAppVersions || {}}
    />
  );
}
