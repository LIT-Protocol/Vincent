import { useParams } from 'react-router';
import { UpdateVersionPage } from './UpdateVersionPage';
import { ConsentPageSkeleton } from '@/components/user-dashboard/consent/ConsentPageSkeleton';
import { GeneralErrorScreen } from '@/components/user-dashboard/consent/GeneralErrorScreen';
import { AuthenticationErrorScreen } from '@/components/user-dashboard/consent/AuthenticationErrorScreen';
import { useConsentInfo } from '@/hooks/user-dashboard/consent/useConsentInfo';
import { useConsentMiddleware } from '@/hooks/user-dashboard/consent/useConsentMiddleware';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { AppVersionNotInRegistryUpdate } from './AppVersionNotInRegistryUpdate';

export function UpdateVersionPageWrapper() {
  const { appId } = useParams();

  const { authInfo, sessionSigs, isProcessing, error } = useReadAuthInfo();
  const { isLoading, isError, errors, data } = useConsentInfo(appId || '');
  const {
    appExists,
    activeVersionExists,
    isLoading: isPermittedLoading,
    error: isPermittedError,
  } = useConsentMiddleware({
    appId: appId || '',
    pkpTokenId: authInfo?.agentPKP?.tokenId || '',
    appData: data?.app,
  });

  // Early return if required params are missing
  if (!appId) {
    return <GeneralErrorScreen errorDetails="App ID was not provided" />;
  }

  const isUserAuthed = authInfo?.userPKP && authInfo?.agentPKP && sessionSigs;
  if (!isProcessing && !isUserAuthed) {
    return <AuthenticationErrorScreen />;
  }

  if (isLoading || isProcessing || isPermittedLoading) {
    return <ConsentPageSkeleton />;
  }

  if (isError || error || isPermittedError) {
    const errorMessage =
      errors.length > 0
        ? errors.join(', ')
        : (error ?? isPermittedError ?? 'An unknown error occurred');
    return <GeneralErrorScreen errorDetails={errorMessage} />;
  }

  if (!data || !authInfo || !sessionSigs) {
    return <ConsentPageSkeleton />;
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
      consentInfoMap={data}
      readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
    />
  );
}
