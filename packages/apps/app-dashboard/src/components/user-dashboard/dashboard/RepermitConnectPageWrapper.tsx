import { useParams } from 'react-router';
import { RepermitConnectPage } from './RepermitConnectPage';
import { ManagePagesSkeleton } from '../connect/ManagePagesSkeleton';
import { GeneralErrorScreen } from '@/components/user-dashboard/connect/GeneralErrorScreen';
import { AuthenticationErrorScreen } from '@/components/user-dashboard/connect/AuthenticationErrorScreen';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { useAgentPkpForApp } from '@/hooks/user-dashboard/useAgentPkpForApp';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';

export function RepermitConnectPageWrapper() {
  const { appId } = useParams();

  const { authInfo, sessionSigs, isProcessing, error } = useReadAuthInfo();
  const userAddress = authInfo?.userPKP?.ethAddress || '';

  // Get agent PKP for this specific app
  const {
    agentPKP,
    loading: agentPKPLoading,
    error: agentPKPError,
  } = useAgentPkpForApp(userAddress, appId ? Number(appId) : undefined);

  // Fetch app data
  const {
    data: appData,
    isLoading: isAppLoading,
    error: appError,
  } = vincentApiClient.useGetAppQuery({ appId: Number(appId) }, { skip: !appId });

  // Early return if required params are missing
  if (!appId) {
    return <GeneralErrorScreen errorDetails="App ID was not provided" />;
  }

  const isUserAuthed = authInfo?.userPKP && sessionSigs;

  // Check if we have finished loading but got no data (invalid appId)
  const hasFinishedLoadingButNoData = !isAppLoading && !appData;

  const isAllDataLoaded =
    appData &&
    !isAppLoading &&
    !isProcessing &&
    // Only wait for agent PKP if user is authenticated
    (isUserAuthed ? !agentPKPLoading && agentPKP : true);

  // Authentication check - must be done before other business logic
  if (!isProcessing && !isUserAuthed) {
    return (
      <AuthenticationErrorScreen readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }} />
    );
  }

  // Check for invalid appId first (finished loading but no data OR has error)
  if (hasFinishedLoadingButNoData || appError) {
    const errorMessage = appError ? String(appError) : `App with ID ${appId} not found`;
    return <GeneralErrorScreen errorDetails={errorMessage} />;
  }

  if (!isAllDataLoaded) {
    return <ManagePagesSkeleton />;
  }

  // Check for any errors
  if (error || agentPKPError) {
    const errorMessage = String(error ?? agentPKPError ?? 'An unknown error occurred');
    return <GeneralErrorScreen errorDetails={errorMessage} />;
  }

  return (
    <RepermitConnectPage
      appData={appData}
      previouslyPermittedPKP={agentPKP!}
      readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
    />
  );
}
