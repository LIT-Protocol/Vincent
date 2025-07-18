import { useParams } from 'react-router';
import { ConsentPageSkeleton } from '../consent/ConsentPageSkeleton';
import { GeneralErrorScreen } from '../consent/GeneralErrorScreen';
import { AuthenticationErrorScreen } from '../consent/AuthenticationErrorScreen';
import { useConsentInfo } from '@/hooks/user-dashboard/consent/useConsentInfo';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { AppPermissionPage } from './UserPermissionPage';
import { useFetchUserPermissions } from '@/hooks/user-dashboard/dashboard/useFetchUserPermissions';

export function UserPermissionWrapper() {
  const { appId } = useParams();
  const { authInfo, sessionSigs, isProcessing, error } = useReadAuthInfo();
  const { isLoading, isError, errors, data } = useConsentInfo(appId || '');
  const {
    existingData,
    isLoading: isExistingDataLoading,
    error: isExistingDataError,
  } = useFetchUserPermissions({
    appId: appId || '',
    pkpTokenId: authInfo?.agentPKP?.tokenId || '',
  });

  if (isProcessing) {
    return <ConsentPageSkeleton />;
  }

  const isUserAuthed = authInfo?.userPKP && authInfo?.agentPKP && sessionSigs;
  if (!isProcessing && !isUserAuthed) {
    return <AuthenticationErrorScreen />;
  }

  if (isLoading || isExistingDataLoading) {
    return <ConsentPageSkeleton />;
  }

  if (isError || error || isExistingDataError) {
    const errorMessage =
      errors.length > 0 ? errors.join(', ') : (error ?? 'An unknown error occurred');
    return <GeneralErrorScreen errorDetails={errorMessage} />;
  }

  return (
    <AppPermissionPage
      consentInfoMap={data}
      readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
      existingData={existingData}
    />
  );
}
