import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  useStatusMessage,
  useConsentApproval,
  useParameterManagement,
  useUserAppPermissionCheck,
  useUserUrlAppId,
  useUserRedirectUri,
  useJwtRedirect,
  useVersionInfoUpdate,
  useAutoParameterUpdate,
} from '@/hooks/user-dashboard';

import {
  useParameterHandler,
  useUpdateParametersHandler,
  useApprovalHandler,
} from '@/hooks/user-dashboard/consentHandlers';

import {
  VersionUpgradeView,
  UntrustedUriView,
  AppNotFoundView,
  AppDeletedView,
  LoadingView,
  DisabledAppView,
  MainConsentFormView,
} from '.';

import { AuthenticatedConsentFormProps, AppView, ContractVersionResult } from '@/types';

/**
 * AuthenticatedConsentForm is the main component for handling app permissions.
 *
 * This component manages the entire flow for agent authorization:
 * 1. Checking if an app is already permitted
 * 2. Verifying redirect URIs for security
 * 3. Handling parameter updates and management
 * 4. Managing version upgrades
 * 5. Providing UI for approval/disapproval actions
 * 6. JWT generation and redirection
 *
 * The component uses several custom hooks to modularize functionality:
 * - useStatusMessage: For status messages and notifications
 * - useJwtRedirect: For JWT token generation and redirection
 * - useParameterManagement: For handling app parameters and stable ready state
 * - useAppPermissionCheck: For checking permissions and app info
 * - useConsentApproval: For handling the consent approval process
 * - useUrlAppId/useUserRedirectUri: For extracting and validating URL parameters
 * - useVersionInfoUpdate: For handling version info updates when permissions change
 */
export default function UserAuthenticatedConsentForm({
  sessionSigs,
  agentPKP,
  userPKP,
}: AuthenticatedConsentFormProps) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { statusMessage, statusType, showStatus, showErrorWithStatus } = useStatusMessage();

  const { appId } = useUserUrlAppId();
  const { redirectUri: encodedRedirectUri } = useUserRedirectUri();
  const redirectUri = encodedRedirectUri ? decodeURIComponent(encodedRedirectUri) : null;

  const {
    appInfo,
    isUriUntrusted,
    showVersionUpgradePrompt,
    showUpdateModal,
    permittedVersion,
    isLoading,
    checkingPermissions,
    handleUpgrade,
    updateState,
    useCurrentVersionOnly,
    isAppDeleted,
    isAppNotFound,
  } = useUserAppPermissionCheck({
    appId,
    agentPKP,
    redirectUri,
    onStatusChange: showStatus,
  });

  const {
    parameters,
    setParameters,
    existingParameters,
    versionInfo,
    fetchVersionInfo,
    fetchExistingParameters,
    stableReady,
  } = useParameterManagement({
    appId,
    agentPKP,
    appInfo,
    onStatusChange: showStatus,
    updateState,
    permittedVersion,
    useCurrentVersionOnly,
    checkingPermissions,
  });

  useVersionInfoUpdate(permittedVersion, appInfo, isLoading, fetchVersionInfo);

  const { approveConsent, updateParameters } = useConsentApproval({
    appId: appId as string,
    appInfo: appInfo as AppView,
    versionInfo: versionInfo as ContractVersionResult,
    parameters,
    agentPKP,
    userPKP,
    sessionSigs,
    permittedVersion,
    onStatusChange: showStatus,
    onError: (error: unknown) => showErrorWithStatus(error as string),
  });

  const { generateJWT, redirectWithJWT } = useJwtRedirect({
    agentPKP,
    sessionSigs,
    redirectUri,
    onStatusChange: showStatus,
  });

  const isAppVersionDisabled = useMemo(() => {
    if (!versionInfo) return false;
    return !versionInfo.appVersion.enabled;
  }, [versionInfo]);

  const appContext = useMemo(
    () => ({
      appInfo,
      appId,
      permittedVersion,
      versionInfo,
      isAppVersionDisabled,
      useCurrentVersionOnly: useCurrentVersionOnly ?? false,
    }),
    [appInfo, appId, permittedVersion, versionInfo, isAppVersionDisabled, useCurrentVersionOnly],
  );

  const userContext = useMemo(
    () => ({
      agentPKP,
    }),
    [agentPKP],
  );

  const uiContext = useMemo(
    () => ({
      showStatus,
      showErrorWithStatus,
      updateState,
      setSubmitting,
    }),
    [showStatus, showErrorWithStatus, updateState, setSubmitting],
  );

  const parameterContext = useMemo(
    () => ({
      existingParameters,
      setParameters,
      fetchExistingParameters,
    }),
    [existingParameters, setParameters, fetchExistingParameters],
  );

  const actionContext = useMemo(
    () => ({
      updateParameters,
      approveConsent,
      fetchVersionInfo,
    }),
    [updateParameters, approveConsent, fetchVersionInfo],
  );

  const redirectContext = useMemo(
    () => ({
      redirectUri,
      generateJWT,
      redirectWithJWT,
      navigate,
    }),
    [redirectUri, generateJWT, redirectWithJWT, navigate],
  );

  const { handleParametersChange } = useParameterHandler(parameterContext);

  const { handleUpdateParameters } = useUpdateParametersHandler({
    app: appContext,
    ui: uiContext,
    parameters: parameterContext,
    actions: actionContext,
  });

  const { handleApprove } = useApprovalHandler({
    app: appContext,
    user: userContext,
    ui: uiContext,
    actions: actionContext,
    redirect: redirectContext,
  });

  // Automatic parameter updates for returning users
  useAutoParameterUpdate({
    showUpdateModal,
    appInfo,
    permittedVersion,
    isLoading,
    versionInfo,
    handleUpdateParameters,
  });

  // Show version upgrade prompt if necessary
  if (showVersionUpgradePrompt && appInfo && permittedVersion !== null) {
    return (
      <VersionUpgradeView
        appInfo={appInfo}
        permittedVersion={permittedVersion}
        statusMessage={statusMessage}
        statusType={statusType}
        onUpgrade={handleUpgrade}
        navigate={navigate}
        onUpdateParameters={handleUpdateParameters}
      />
    );
  }

  // If URL is untrusted, show an error message
  if (isUriUntrusted) {
    return (
      <UntrustedUriView
        redirectUri={redirectUri}
        appInfo={appInfo}
        statusMessage={statusMessage}
        statusType={statusType}
      />
    );
  }

  // If the app is not found, show an error message
  if (isAppNotFound) {
    return <AppNotFoundView statusMessage={statusMessage} statusType={statusType} />;
  }

  // If app is deleted, show an error message
  if (isAppDeleted) {
    return <AppDeletedView statusMessage={statusMessage} statusType={statusType} />;
  }

  // Show loading indicator until stably ready
  if (!stableReady) {
    return <LoadingView statusMessage={statusMessage} statusType={statusType} />;
  }

  // If the app version is disabled, show a full-screen notice instead of the regular content
  // Only show when permittedVersion is not null (not upgrading to latest version)
  if (versionInfo && isAppVersionDisabled && appInfo && permittedVersion !== null) {
    return <DisabledAppView appInfo={appInfo} versionInfo={versionInfo} navigate={navigate} />;
  }

  return (
    <MainConsentFormView
      versionInfo={versionInfo}
      permittedVersion={permittedVersion}
      existingParameters={existingParameters}
      statusMessage={statusMessage}
      statusType={statusType}
      submitting={submitting}
      useCurrentVersionOnly={useCurrentVersionOnly ?? false}
      navigate={navigate}
      handleApprove={handleApprove}
      handleParametersChange={handleParametersChange}
    />
  );
}
