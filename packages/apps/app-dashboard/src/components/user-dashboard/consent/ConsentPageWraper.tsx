import { useParams } from 'react-router';
import { ConsentPage } from './ConsentPage';
import { ConsentPageSkeleton } from './ConsentPageSkeleton';
import { GeneralErrorScreen } from './GeneralErrorScreen';
import { useConsentInfo } from '@/hooks/user-dashboard/consent/useConsentInfo';
import { useConsentMiddleware } from '@/hooks/user-dashboard/consent/useConsentMiddleware';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { ReturningUserConsent } from './ReturningUserConsent';
import { AppNotInRegistryConsent } from './AppNotInRegistry';
import { AppVersionNotInRegistryConsent } from './AppVersionNotInRegistry';

export function ConsentPageWrapper() {
  const { appId } = useParams();

  const { authInfo, sessionSigs, isProcessing, error } = useReadAuthInfo();
  const { isLoading, isError, errors, data } = useConsentInfo(appId || '');
  const {
    isPermitted,
    appExists,
    activeVersionExists,
    userPermittedVersion,
    isLoading: isPermittedLoading,
    error: isPermittedError,
  } = useConsentMiddleware({
    appId: appId || '',
    pkpTokenId: authInfo?.agentPKP?.tokenId || '',
    appData: data?.app,
  });

  // Early return if required params are missing
  if (!appId || !authInfo?.agentPKP?.tokenId) {
    return <ConsentPageSkeleton />;
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

  if (appExists === false) {
    return (
      <AppNotInRegistryConsent
        appData={data.app}
        readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
      />
    );
  }

  if (appExists === true && activeVersionExists === false) {
    return (
      <AppVersionNotInRegistryConsent
        appData={data.app}
        readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
      />
    );
  }

  if (isPermitted === true && userPermittedVersion) {
    return (
      <ReturningUserConsent
        appData={data.app}
        version={userPermittedVersion}
        readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
      />
    );
  }

  return (
    <ConsentPage
      consentInfoMap={data}
      readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
    />
  );
}
