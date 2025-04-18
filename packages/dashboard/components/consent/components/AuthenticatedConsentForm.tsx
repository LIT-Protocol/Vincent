import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import '../styles/parameter-fields.css';
import VersionParametersForm from './authForm/VersionParametersForm';
import { useErrorPopup } from '@/providers/error-popup';
import Image from 'next/image';

import StatusMessage from './authForm/StatusMessage';
import StatusAnimation from './authForm/StatusAnimation';
import ParameterUpdateModal from './authForm/ParameterUpdateModal';
import ConsentActions from './authForm/ConsentActions';
import RedirectMessage from './authForm/RedirectMessage';
import VersionUpgradePrompt from './authForm/VersionUpgradePrompt';
import UntrustedUriError from './authForm/UntrustedUriError';
import DeletedAppError from './DeletedAppError';
import Loading from './Loading';
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

  // Add a check for disabled app version
  const isAppVersionDisabled = useMemo(() => {
    if (!versionInfo) return false;

    // Check if version is not enabled (disabled)
    return !versionInfo.appVersion.enabled;
  }, [versionInfo]);


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
    // Prevent approval for disabled app versions
    if (isAppVersionDisabled) {
      const errorMessage = 'This app version has been disabled and cannot be approved.';
      setError(errorMessage);
      showErrorWithStatus(errorMessage, 'App Disabled');
      return;
    }

    if (!appInfo) {
      console.error('Missing version data in handleApprove');
      const errorMessage = 'Missing version data. Please refresh the page and try again.';
      setError(errorMessage);
      showErrorWithStatus(errorMessage, 'Missing Data');
      return;
    }

    setSubmitting(true);
    showStatus('Processing approval...', 'info');
    
    try {
      const appVersion = permittedVersion || Number(appInfo.latestVersion);
      if (!agentPKP || !appId || !appVersion) {
        const errorMessage = 'Missing required data. Please try again.';
        setError(errorMessage);
        showErrorWithStatus(errorMessage, 'Missing Data');
        return;
      }

      let result;
      if (useCurrentVersionOnly) {
        result = await updateParameters();
      } else {
        result = await approveConsent();
      }

      if (!result || !result.success) {
        const errorMessage = result?.message || 'Approval process failed';
        showErrorWithStatus(errorMessage, 'Approval Failed');
        return;
      }

      showStatus('Generating authentication token...', 'info');
      const jwt = await generateJWT(appId, appVersion, appInfo);
      updateState({ showSuccess: true });

      showStatus('Approval successful! Redirecting...', 'success');
      setTimeout(() => {
        redirectWithJWT(jwt);
      }, 2000);
    } catch (err) {
      console.error('Error submitting form:', err);
      // Show a user-friendly error message
      const errorMessage = 'Something went wrong. Please try again.';
      setError(errorMessage);
      showErrorWithStatus(errorMessage, 'Error');
    } finally {
      setSubmitting(false);
    }
  }, [approveConsent, updateParameters, generateJWT, redirectWithJWT, agentPKP, appId, appInfo, showErrorWithStatus, showStatus, updateState, useCurrentVersionOnly, permittedVersion]);

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

      if (!result || !result.success) {
        const errorMessage = result?.message || 'Disapproval process failed';
        setError(errorMessage);
        showErrorWithStatus(errorMessage, 'Disapproval Failed');
        updateState({ showDisapproval: false });
        return;
      }

      if (result.redirectUri) {
        executeRedirect(result.redirectUri);
      }
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
      <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center">
          <div className="h-8 w-8 rounded-md flex items-center justify-center">
            <Image src="/V.svg" alt="Vincent logo" width={20} height={20} />
          </div>
          <div className="ml-3 text-base font-medium text-gray-700">Authorize with Vincent</div>
        </div>

        {/* Content */}
        <div className="p-6">
          <StatusMessage message={statusMessage} type={statusType} />
          <ParameterUpdateModal
            isOpen={showUpdateModal && !isLoadingParameters}
            onContinue={handleContinueWithExisting}
            onUpdate={handleUpdateParameters}
            appName={appInfo.name}
            permittedVersion={permittedVersion}
          />
          {isLoadingParameters && (
            <p className="text-center mt-4 text-gray-600">Loading your existing parameters...</p>
          )}
        </div>
      </div>
    );
  }

  // If URL is untrusted, show an error message
  if (isUriUntrusted) {
    return (
      <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center">
          <div className="h-8 w-8 rounded-md flex items-center justify-center">
            <Image src="/V.svg" alt="Vincent logo" width={20} height={20} />
          </div>
          <div className="ml-3 text-base font-medium text-gray-700">Authorize with Vincent</div>
        </div>

        {/* Content */}
        <div className="p-6">
          <StatusMessage message={statusMessage} type={statusType} />
          <UntrustedUriError
            redirectUri={redirectUri}
            appInfo={appInfo}
            statusMessage={statusMessage}
            statusType={statusType}
          />
        </div>
      </div>
    );
  }

  // If app is deleted, show an error message
  if (isAppDeleted) {
    return (
      <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center">
          <div className="h-8 w-8 rounded-md flex items-center justify-center">
            <Image src="/V.svg" alt="Vincent logo" width={20} height={20} />
          </div>
          <div className="ml-3 text-base font-medium text-gray-700">Authorize with Vincent</div>
        </div>

        {/* Content */}
        <div className="p-6">
          <StatusMessage message={statusMessage} type={statusType} />
          <DeletedAppError
            statusMessage={statusMessage}
            statusType={statusType}
          />
        </div>
      </div>
    );
  }

  // Change the rendering order to check for version upgrade prompt before checking for already permitted
  // If the app is already permitted, show a brief loading spinner or success animation
  if (showVersionUpgradePrompt && appInfo && permittedVersion !== null) {
    return (
      <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center">
          <div className="h-8 w-8 rounded-md flex items-center justify-center">
            <Image src="/V.svg" alt="Vincent logo" width={20} height={20} />
          </div>
          <div className="ml-3 text-base font-medium text-gray-700">Authorize with Vincent</div>
        </div>

        {/* Content */}
        <div className="p-6">
          <VersionUpgradePrompt
            appInfo={appInfo}
            permittedVersion={permittedVersion}
            onUpgrade={handleUpgrade}
            onContinue={continueWithExistingPermission}
            onUpdateParameters={handleUpdateParameters}
          />
        </div>
      </div>
    );
  }

  // Only check this after we've checked for the version upgrade prompt
  if ((isAppAlreadyPermitted && !showUpdateModal) || (showSuccess && !showUpdateModal) || (showingAuthorizedMessage && !showUpdateModal)) {
    return (
      <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center">
          <div className="h-8 w-8 rounded-md flex items-center justify-center">
            <Image src="/V.svg" alt="Vincent logo" width={20} height={20} />
          </div>
          <div className="ml-3 text-base font-medium text-gray-700">Authorize with Vincent</div>
        </div>

        {/* Content */}
        <div className="p-6">
          <StatusMessage message={statusMessage} type={statusType} />
          <RedirectMessage
            showSuccess={showSuccess}
            showDisapproval={showDisapproval}
            statusMessage={statusMessage}
            statusType={statusType}
          />
        </div>
      </div>
    );
  }

  // Show loading indicator while checking permissions or loading app info
  if (checkingPermissions || isLoading) {
    return (
      <Loading
        copy={statusMessage || 'Loading app information...'}
        type="info"
        appName={appInfo?.name}
        appDescription={appInfo?.description}
      />
    );
  }

  // Show error message if there's no appId or if there's an error
  if (!appId) {
    showErrorWithStatus('Missing appId parameter', 'Invalid Request');
    return (
      <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center">
          <div className="h-8 w-8 rounded-md flex items-center justify-center">
            <Image src="/V.svg" alt="Vincent logo" width={20} height={20} />
          </div>
          <div className="ml-3 text-base font-medium text-gray-700">Authorize with Vincent</div>
        </div>

        {/* Content */}
        <div className="p-6">
          <StatusMessage message="Missing app ID" type="error" />
          <p className="text-center mt-3 text-gray-700">Invalid request. Missing app ID.</p>
        </div>
      </div>
    );
  }

  if (urlError) {
    // Use the error popup instead of inline display
    return (
      <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center">
          <div className="h-8 w-8 rounded-md flex items-center justify-center">
            <Image src="/V.svg" alt="Vincent logo" width={20} height={20} />
          </div>
          <div className="ml-3 text-base font-medium text-gray-700">Authorize with Vincent</div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-center text-gray-700">Invalid request. Please check your URL parameters.</p>
        </div>
      </div>
    );
  }

  if (redirectError) {
    // Use the error popup instead of inline display
    return (
      <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center">
          <div className="h-8 w-8 rounded-md flex items-center justify-center">
            <Image src="/V.svg" alt="Vincent logo" width={20} height={20} />
          </div>
          <div className="ml-3 text-base font-medium text-gray-700">Authorize with Vincent</div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-center text-gray-700">Invalid redirect URI. Please check your URL parameters.</p>
        </div>
      </div>
    );
  }

  // If the app version is disabled, show a full-screen notice instead of the regular content
  if (versionInfo && isAppVersionDisabled && appInfo) {
    return (
      <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center">
          <div className="h-8 w-8 rounded-md flex items-center justify-center">
            <Image src="/V.svg" alt="Vincent logo" width={20} height={20} />
          </div>
          <div className="ml-3 text-base font-medium text-gray-700">Authorize with Vincent</div>
        </div>

        {/* Content - Disabled App Notice */}
        <div className="p-6">
          <div className="text-xl font-semibold text-center mb-2">
            {appInfo.name} wants to use your Agent Wallet
          </div>

          {appInfo.description && (
            <div className="text-center text-gray-600 text-sm mb-4">
              {appInfo.description}
              <br></br>
              Version: {versionInfo ? versionInfo.appVersion.version.toString() : 'No version data'} • 
              App Mode: {appInfo.deploymentStatus === 0 ? 'DEV' :
                       appInfo.deploymentStatus === 1 ? 'TEST' :
                       appInfo.deploymentStatus === 2 ? 'PROD' : 'Unknown'}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-6">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Notice:</span> This version of {appInfo.name} is currently disabled by the developer and cannot be authorized. Please contact the app developer for assistance or try again later.
            </p>
          </div>

          <div className="flex justify-center mt-6">
            <button
              className="bg-black text-white rounded-lg py-3 px-8 font-medium text-sm hover:bg-gray-900 transition-colors"
              onClick={handleDisapprove}
            >
              Go Back
            </button>
          </div>
        </div>

        <div className="px-6 py-3 text-center border-t border-gray-100">
          <p className="text-xs text-black flex items-center justify-center">
            <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11H16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <a href="https://litprotocol.com" target="_blank" rel="noopener noreferrer" className="flex items-center">
              Protected by <Image src="/wordmark.svg" alt="Lit" width={15} height={9} className="ml-1" />
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center">
        <div className="h-8 w-8 rounded-md flex items-center justify-center">
          <Image src="/V.svg" alt="Vincent logo" width={20} height={20} />
        </div>
        <div className="ml-3 text-base font-medium text-gray-700">Authorize with Vincent</div>
      </div>

      {/* Content */}
      <div className="p-6">
        <StatusMessage message={statusMessage} type={statusType} />
        {showSuccess && <StatusAnimation type="success" />}
        {showDisapproval && <StatusAnimation type="disapproval" />}

        {appInfo && (
          <>
            <div className="text-xl font-semibold text-center mb-2">
              {appInfo.name} wants to use your Agent Wallet
            </div>

            {appInfo.description && (
              <div className="text-center text-gray-600 text-sm mb-4">
                {appInfo.description}
                <br></br>
                Version: {versionInfo ? versionInfo.appVersion.version.toString() : 'No version data'} • 
                App Mode: {appInfo.deploymentStatus === 0 ? 'DEV' :
                         appInfo.deploymentStatus === 1 ? 'TEST' :
                         appInfo.deploymentStatus === 2 ? 'PROD' : 'Unknown'}
              </div>
            )}

            {agentPKP && (
              <div className="text-center text-gray-500 text-sm font-mono bg-gray-50 py-2 px-3 rounded-md mb-6 border border-gray-100">
                EVM Address: {agentPKP.ethAddress}
              </div>
            )}


            {versionInfo && (
              <VersionParametersForm
                versionInfo={versionInfo}
                onChange={handleParametersChange}
                existingParameters={existingParameters}
                key={`params-form-${useCurrentVersionOnly ? `v${permittedVersion}` : 'latest'}`}
              />
            )}

            <div className="text-xs text-gray-500 mb-6 bg-gray-50 p-3 rounded-lg">
              You can change your parameters anytime by revisiting this page.
            </div>

            <ConsentActions
              onApprove={handleApprove}
              onDisapprove={handleDisapprove}
              submitting={submitting}
            />
          </>
        )}
      </div>
      <div className="px-6 py-3 text-center border-t border-gray-100">
        <p className="text-xs text-black flex items-center justify-center">
          <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11H16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <a href="https://litprotocol.com" target="_blank" rel="noopener noreferrer" className="flex items-center">
            Protected by <Image src="/wordmark.svg" alt="Lit" width={15} height={9} className="ml-1" />
          </a>
        </p>
      </div>
    </div>
  );
}
