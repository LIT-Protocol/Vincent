import { useState, useEffect, useCallback, useRef } from 'react';

import '../styles/parameter-fields.css';
import VersionParametersForm from './authForm/VersionParametersForm';
import { useErrorPopup } from '@/providers/error-popup';

import StatusMessage from './authForm/StatusMessage';
import StatusAnimation from './authForm/StatusAnimation';
import ParameterUpdateModal from './authForm/ParameterUpdateModal';
import AppInfo from './authForm/AppInfo';
import ConsentActions from './authForm/ConsentActions';
import RedirectMessage from './authForm/RedirectMessage';
import VersionUpgradePrompt from './authForm/VersionUpgradePrompt';
import UntrustedUriError from './authForm/UntrustedUriError';
import DeletedAppError from './DeletedAppError';
import { useUrlAppId } from '../hooks/useUrlAppId';
import { useUrlRedirectUri } from '../hooks/useUrlRedirectUri';
import { useStatusMessage } from '../hooks/useStatusMessage';
import { useConsentApproval } from '../hooks/useConsentApproval';
import { useConsentDisapproval } from '../hooks/useConsentDisapproval';
import { useJwtRedirect } from '../hooks/useJwtRedirect';
import { useParameterManagement } from '../hooks/useParameterManagement';
import { useAppPermissionCheck } from '../hooks/useAppPermissionCheck';

// Import types
import {
  AuthenticatedConsentFormProps,
  VersionParameter,
  AppView,
  ContractVersionResult
} from '../types';

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
 * - useParameterManagement: For handling app parameters
 * - useAppPermissionCheck: For checking permissions and app info
 * - useConsentApproval: For handling the consent approval process
 * - useConsentDisapproval: For handling the disapproval flow
 */
export default function AuthenticatedConsentForm({
  sessionSigs,
  agentPKP,
  isSessionValidation,
  userPKP,
}: AuthenticatedConsentFormProps) {
  const { appId, error: urlError } = useUrlAppId();
  const { redirectUri: encodedRedirectUri, error: redirectError } = useUrlRedirectUri();
  const redirectUri = encodedRedirectUri ? decodeURIComponent(encodedRedirectUri) : null;

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Use the extracted status message hook
  const { statusMessage, statusType, showStatus, showErrorWithStatus } = useStatusMessage();

  // Add the error popup hook
  useErrorPopup();

  // Use the JWT redirect hook
  const { generateJWT, redirectWithJWT } = useJwtRedirect({
    agentPKP,
    sessionSigs,
    redirectUri,
    onStatusChange: showStatus
  });

  const fetchExistingParametersRef = useRef<(() => Promise<void>) | undefined>(undefined);

  const {
    appInfo,
    isAppAlreadyPermitted,
    isUriUntrusted,
    showVersionUpgradePrompt,
    showUpdateModal,
    permittedVersion,
    showingAuthorizedMessage,
    showSuccess,
    showDisapproval,
    isLoading,
    checkingPermissions,
    continueWithExistingPermission,
    handleUpgrade,
    updateState,
    useCurrentVersionOnly,
    isAppDeleted
  } = useAppPermissionCheck({
    appId,
    agentPKP,
    redirectUri,
    generateJWT,
    redirectWithJWT,
    fetchExistingParameters: useCallback(async () => {
      if (fetchExistingParametersRef.current) {
        return fetchExistingParametersRef.current();
      }
    }, []),
    onStatusChange: showStatus
  });

  // Use the parameter management hook
  const {
    parameters,
    setParameters,
    existingParameters,
    isLoadingParameters,
    versionInfo,
    fetchVersionInfo,
    fetchExistingParameters,
  } = useParameterManagement({
    appId,
    agentPKP,
    appInfo,
    onStatusChange: showStatus
  });

  // Set the fetchExistingParameters ref after it's created
  useEffect(() => {
    if (fetchExistingParameters && fetchExistingParametersRef.current !== fetchExistingParameters) {
      fetchExistingParametersRef.current = fetchExistingParameters;
    }
  }, [fetchExistingParameters]);

  /**
   * Ensures parameters are fetched once when appInfo becomes available.
   * This useEffect:
   * 1. Runs when appInfo becomes available
   * 2. Fetches version info if needed
   * 3. Uses a ref to prevent duplicate calls
   */
  const appInfoSetRef = useRef(false);
  useEffect(() => {
    if (appInfo && !appInfoSetRef.current) {
      appInfoSetRef.current = true;

      // We'll let the permission check flow handle parameter fetching
      if (!versionInfo) {
        fetchVersionInfo();
      }
    }
  }, [appInfo, fetchVersionInfo, versionInfo]);

  // Use the consent approval hook
  const { approveConsent, updateParameters } = useConsentApproval({
    appId: appId as string,
    appInfo: appInfo as AppView,
    versionInfo: versionInfo as ContractVersionResult,
    parameters,
    agentPKP,
    userPKP,
    sessionSigs,
    onStatusChange: showStatus,
    onError: showErrorWithStatus
  });

  // Add the consent disapproval hook
  const { disapproveConsent, executeRedirect } = useConsentDisapproval({
    redirectUri,
    onStatusChange: showStatus,
    onError: showErrorWithStatus
  });

  const permittedVersionFetchedRef = useRef<number | null>(null);

  useEffect(() => {
    if (useCurrentVersionOnly && permittedVersion !== null && appId &&
      permittedVersionFetchedRef.current !== permittedVersion) {
      permittedVersionFetchedRef.current = permittedVersion;

      updateState({ isLoading: true });

      fetchVersionInfo(permittedVersion)
        .then(() => {
          updateState({ isLoading: false });

          if (existingParameters.length === 0 && !isLoadingParameters) {
            fetchExistingParameters();
          }
        })
        .catch(error => {
          console.error(`Error fetching version ${permittedVersion} data:`, error);
          updateState({ isLoading: false });
          showErrorWithStatus('Failed to load version data', 'Error');
        });
    } else if (!useCurrentVersionOnly) {
      permittedVersionFetchedRef.current = null;

      // If we previously used a specific version, we should reload the latest version
      if (permittedVersionFetchedRef.current !== null) {
        updateState({ isLoading: true });
        fetchVersionInfo()
          .then(() => updateState({ isLoading: false }))
          .catch(() => updateState({ isLoading: false }));
      }
    }
  }, [useCurrentVersionOnly, permittedVersion, appId, fetchVersionInfo, fetchExistingParameters, existingParameters, isLoadingParameters, updateState, showErrorWithStatus]);

  // Use error popup for URL errors
  useEffect(() => {
    if (urlError) {
      showErrorWithStatus(urlError, 'URL Error');
    }
    if (redirectError) {
      showErrorWithStatus(redirectError, 'Redirect Error');
    }
  }, [urlError, redirectError, showErrorWithStatus]);

  // Add a ref to track when we've fetched parameters for a version
  const paramsFetchedForVersionRef = useRef<number | null>(null);

  // Add a dedicated effect to fetch parameters when updating the current version
  useEffect(() => {
    // We only want this to run when useCurrentVersionOnly is true and we don't have existingParameters yet
    if (useCurrentVersionOnly &&
      existingParameters.length === 0 &&
      !isLoadingParameters &&
      appId &&
      agentPKP &&
      permittedVersion !== null &&
      paramsFetchedForVersionRef.current !== permittedVersion) {

      paramsFetchedForVersionRef.current = permittedVersion;

      fetchExistingParameters().catch(error => {
        console.error('Error fetching existing parameters:', error);
        paramsFetchedForVersionRef.current = null; // Reset on error to allow retry
      });
    }
  }, [useCurrentVersionOnly, existingParameters.length, isLoadingParameters, appId, agentPKP, fetchExistingParameters, permittedVersion]);

  /**
   * Handles parameter changes from the form.
   * Makes sure parameter changes are stored for submission.
   */
  const handleParametersChange = useCallback((newParameters: VersionParameter[]) => {

    // Important: Make sure all parameter values are properly set
    const validatedParameters = newParameters.map(param => ({
      ...param,
      // Ensure value is not undefined (prevents errors in contract calls)
      value: param.value === undefined ? '' : param.value
    }));

    // Update the parameters state with the new values
    setParameters(validatedParameters);
  }, [setParameters]);

  // ===== Event Handler Functions =====

  /**
   * Handles the approval action when the user grants permission to the app.
   * This function:
   * 1. Validates required data (appInfo, agentPKP, appId)
   * 2. Calls the approval process from the useConsentApproval hook
   * 3. Generates a JWT for authentication
   * 4. Redirects the user to the app with the JWT
   * 5. Handles errors and displays appropriate messages
   */
  const handleApprove = useCallback(async () => {
    if (!appInfo) {
      console.error('Missing version data in handleApprove');
      const errorMessage = 'Missing version data. Please refresh the page and try again.';
      setError(errorMessage);
      showErrorWithStatus(errorMessage, 'Missing Data');
      setSubmitting(false);
      return;
    }

    setSubmitting(true);
    showStatus('Processing approval...', 'info');
    try {
      const handleFormSubmission = async (): Promise<{ success: boolean }> => {
        try {
          if (!appInfo) {
            console.error(
              'Missing version data in handleFormSubmission'
            );
            const errorMessage = 'Missing version data. Please try again.';
            setError(errorMessage);
            showErrorWithStatus(errorMessage, 'Missing Data');
            return { success: false };
          }

          if (!agentPKP || !appId) {
            console.error(
              'Missing required data for consent approval in handleFormSubmission'
            );
            const errorMessage = 'Missing required data. Please try again.';
            setError(errorMessage);
            showErrorWithStatus(errorMessage, 'Missing Data');
            return { success: false };
          }

          // If we're specifically updating parameters for the current version,
          // use updateParameters instead of full consent approval
          if (useCurrentVersionOnly) {
            await updateParameters();
          } else {
            await approveConsent();
          }

          showStatus('Generating authentication token...', 'info');
          const jwt = await generateJWT(appInfo);
          updateState({ showSuccess: true });

          showStatus('Approval successful! Redirecting...', 'success');
          setTimeout(() => {
            redirectWithJWT(jwt);
          }, 2000);

          return {
            success: true,
          };
        } catch (error) {
          // Error details are already handled by approveConsent()
          // Just log the error here for tracing purposes
          console.error('Error processing transaction:', {
            error,
            errorCode: (error as any).code,
            errorMessage: (error as any).message,
            errorReason: (error as any).reason,
            errorData: (error as any).data,
          });
          throw error;
        }
      };

      await handleFormSubmission();
    } catch (err) {
      console.error('Error submitting form:', err);
    } finally {
      setSubmitting(false);
    }
  }, [approveConsent, updateParameters, generateJWT, redirectWithJWT, agentPKP, appId, appInfo, showErrorWithStatus, showStatus, updateState, useCurrentVersionOnly, parameters]);

  /**
   * Handles the disapproval action when the user denies permission to the app.
   * This function:
   * 1. Updates UI state to show disapproval
   * 2. Calls the disapproval handler from the useConsentDisapproval hook
   * 3. Redirects to the appropriate URI with an error message
   * 4. Handles errors and displays appropriate messages
   */
  const handleDisapprove = useCallback(async () => {
    setSubmitting(true);
    try {
      updateState({ showDisapproval: true });

      const result = await disapproveConsent();

      setTimeout(() => {
        if (result.redirectUri) {
          executeRedirect(result.redirectUri);
        }
      }, 1000);
    } catch (err) {
      console.error('Error in handleDisapprove:', err);
      const errorMessage = 'Failed to disapprove. Please try again.';
      setError(errorMessage);
      showErrorWithStatus(errorMessage, 'Disapproval Failed');
      updateState({ showDisapproval: false });
    } finally {
      setSubmitting(false);
    }
  }, [disapproveConsent, executeRedirect, setError, showErrorWithStatus, updateState]);

  /**
   * Handles continuing with existing parameters without updating them.
   * This function:
   * 1. Hides the update modal
   * 2. Continues the existing permission flow with current parameters
   */
  const handleContinueWithExisting = useCallback(() => {
    updateState({ showUpdateModal: false });
    continueWithExistingPermission();
  }, [continueWithExistingPermission, updateState]);

  /**
   * Handles updating parameters for an app with existing permissions.
   * This function:
   * 1. Updates the UI state to close modals
   * 2. Sets the parameters form with existing parameter values
   */
  const handleUpdateParameters = useCallback(() => {
    // Reset the refs to ensure we'll fetch the correct version info
    permittedVersionFetchedRef.current = null;
    paramsFetchedForVersionRef.current = null;

    updateState({
      showUpdateModal: false,
      showingAuthorizedMessage: false,
      showSuccess: false,
      isAppAlreadyPermitted: false,
      showVersionUpgradePrompt: false,
      isLoading: true, // Set to true to show loading indicator
      checkingPermissions: false,
      useCurrentVersionOnly: true
    });

    // Ensure we load existing parameters if they're not already loaded
    const fetchAndPopulateParameters = async () => {
      try {
        if (existingParameters.length === 0) {
          await fetchExistingParameters();
        }

        // Ensure we have the parameters before setting them
        if (existingParameters.length > 0) {
          setParameters(existingParameters);
        }
      } catch (error) {
        console.error('Error loading existing parameters:', error);
      }
    };

    // Explicitly force a version refresh if we have permittedVersion
    if (permittedVersion !== null && appId) {
      fetchVersionInfo(permittedVersion)
        .then(() => {
          fetchAndPopulateParameters().then(() => {
            updateState({ isLoading: false });
          });
        })
        .catch(error => {
          console.error('Error fetching permitted version data:', error);
          updateState({ isLoading: false });
          showErrorWithStatus('Failed to load version data', 'Error');
        });
    } else {
      fetchAndPopulateParameters().then(() => {
        updateState({ isLoading: false });
      });
    }
  }, [existingParameters, setParameters, updateState, permittedVersion, appId, fetchVersionInfo, fetchExistingParameters, showErrorWithStatus]);


  useEffect(() => {
    if (error) {
      showErrorWithStatus(error, 'Error');
    }
  }, [error, showErrorWithStatus]);

  // ===== Render Logic =====

  // Show the parameter update modal - this should take precedence over all other views
  if (showUpdateModal && appInfo && permittedVersion !== null) {
    return (
      <div className='container'>
        <div className='consent-form-container'>
          <StatusMessage message={statusMessage} type={statusType} />
          <ParameterUpdateModal
            isOpen={showUpdateModal && !isLoadingParameters}
            onContinue={handleContinueWithExisting}
            onUpdate={handleUpdateParameters}
            appName={appInfo.name}
            permittedVersion={permittedVersion}
          />
          {isLoadingParameters && (
            <p className="text-center mt-4">Loading your existing parameters...</p>
          )}
        </div>
      </div>
    );
  }

  // If URL is untrusted, show an error message
  if (isUriUntrusted) {
    return (
      <UntrustedUriError
        redirectUri={redirectUri}
        appInfo={appInfo}
        statusMessage={statusMessage}
        statusType={statusType}
      />
    );
  }

  // If app is deleted, show an error message
  if (isAppDeleted) {
    return (
      <DeletedAppError
        statusMessage={statusMessage}
        statusType={statusType}
      />
    );
  }

  // Change the rendering order to check for version upgrade prompt before checking for already permitted
  // If the app is already permitted, show a brief loading spinner or success animation
  if (showVersionUpgradePrompt && appInfo && permittedVersion !== null) {
    return (
      <VersionUpgradePrompt
        appInfo={appInfo}
        permittedVersion={permittedVersion}
        agentPKP={agentPKP}
        onUpgrade={handleUpgrade}
        onContinue={continueWithExistingPermission}
        onUpdateParameters={handleUpdateParameters}
        statusMessage={statusMessage}
        statusType={statusType}
      />
    );
  }

  // Only check this after we've checked for the version upgrade prompt
  if ((isAppAlreadyPermitted && !showUpdateModal) || (showSuccess && !showUpdateModal) || (showingAuthorizedMessage && !showUpdateModal)) {
    return (
      <RedirectMessage
        showSuccess={showSuccess}
        showDisapproval={showDisapproval}
        statusMessage={statusMessage}
        statusType={statusType}
      />
    );
  }

  // Show loading indicator while checking permissions or loading app info
  if (checkingPermissions || isLoading) {
    return (
      <div className='container'>
        <div className='consent-form-container'>
          <StatusMessage message={statusMessage || 'Loading app information...'} type="info" />
          <div className="text-center mt-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            {appInfo && (
              <div className="mt-3">
                <h3>{appInfo.name}</h3>
                <p>{appInfo.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show error message if there's no appId or if there's an error
  if (!appId) {
    showErrorWithStatus('Missing appId parameter', 'Invalid Request');
    return (
      <div className='consent-form-container'>
        <StatusMessage message="Missing app ID" type="error" />
        <p>Invalid request. Missing app ID.</p>
      </div>
    );
  }

  if (urlError) {
    // Use the error popup instead of inline display
    return (
      <div className='consent-form-container'>
        <p>Invalid request. Please check your URL parameters.</p>
      </div>
    );
  }

  if (redirectError) {
    // Use the error popup instead of inline display
    return (
      <div className='consent-form-container'>
        <p>Invalid redirect URI. Please check your URL parameters.</p>
      </div>
    );
  }

  return (
    <div
      className={
        isSessionValidation ? 'session-validator-consent' : 'container'
      }
    >
      <div className='consent-form-container'>
        <StatusMessage message={statusMessage} type={statusType} />

        {showSuccess && <StatusAnimation type="success" />}
        {showDisapproval && <StatusAnimation type="disapproval" />}

        <h1 className="text-center">Vincent Consent Notice</h1>

        {appInfo && (
          <>
            <AppInfo
              appInfo={{
                ...appInfo,
                // Override the displayed version if we're updating parameters only
                latestVersion: useCurrentVersionOnly && permittedVersion !== null ?
                  permittedVersion :
                  appInfo.latestVersion
              }}
              agentPKP={agentPKP}
              versionInfo={versionInfo!}
              showIPFSDetails={true}
            />

            {versionInfo && (
              <VersionParametersForm
                versionInfo={versionInfo}
                onChange={handleParametersChange}
                existingParameters={existingParameters}
                key={`params-form-${useCurrentVersionOnly ? `v${permittedVersion}` : 'latest'}`}
              />
            )}

            <ConsentActions
              onApprove={handleApprove}
              onDisapprove={handleDisapprove}
              submitting={submitting}
            />
          </>
        )}
      </div>
    </div>
  );
}
