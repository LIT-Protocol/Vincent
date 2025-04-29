import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useErrorPopup } from '@/providers/ErrorPopup';
import { wrap } from '@/utils/components';
import { UserProviders } from '@/providers';
import { litNodeClient } from '@/components/consent/utils/lit';
import { useReadAuthInfo } from '@/components/consent/hooks/useAuthInfo';
import UserLayout from '@/components/layout/UserLayout';
import { useParameterManagement } from '@/components/consent/hooks/useParameterManagement';
import { upgradeAppToLatestVersion } from '@/utils/upgradeUtils';
import { useVersionEnabledCheck } from '@/components/consent/hooks/useVersionEnabledCheck';
import ConsentView from '@/components/consent/pages/index';
import { StatusType, AppDetailsState } from '../types';
import { fetchAppDetails, getVersionStatusText } from '../utils/appDetailsUtils';
import { updateParametersForApp } from '../utils/parameterUtils';
import { AppInfoSection } from '../../../components/user/components/AppInfoSection';
import { VersionUpgradeSection } from '../../../components/user/components/VersionUpgradeSection';
import { ParameterSettingsSection } from '../../../components/user/components/ParameterSettingsSection';
import { AppHeader } from '../../../components/user/components/AppHeader';
import { StatusHandler } from '../../../components/user/components/StatusHandler';
import {
  ErrorState,
  AppNotFound,
  LoadingState,
} from '../../../components/user/components/ErrorState';

function AppDetailsPage() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const { showError } = useErrorPopup();
  const [isLoading, setIsLoading] = useState(true);
  const [app, setApp] = useState<AppDetailsState | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<StatusType>('info');
  const [authFailed, setAuthFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Get authentication info
  const { sessionSigs, authInfo, isProcessing } = useReadAuthInfo();

  const versionFetchedRef = useRef(false);

  // Add version enabled checks
  const { isVersionEnabled: isCurrentVersionEnabled } = useVersionEnabledCheck({
    versionNumber: app?.permittedVersion || 0,
    specificAppId: appId,
  });

  const { isVersionEnabled: isLatestVersionEnabled } = useVersionEnabledCheck({
    versionNumber: app?.latestVersion || 0,
    specificAppId: appId,
  });

  const versionStatusText = getVersionStatusText(
    app,
    isCurrentVersionEnabled,
    isLatestVersionEnabled,
  );
  const shouldDisableUpgrade = isLatestVersionEnabled === false;

  // Function to handle showing status messages
  const showStatus = (message: string, type: StatusType = 'info') => {
    setStatusMessage(message);
    setStatusType(type);
  };

  // Create enhanced error function that shows both popup and status error
  const showErrorWithStatus = (errorMessage: string, title?: string, details?: string) => {
    // Show error in popup
    showError(errorMessage, title || 'Error', details);
    // Also show in status message
    showStatus(errorMessage, 'error');
  };

  // Initialize parameter management hook
  const {
    parameters,
    existingParameters,
    versionInfo,
    handleParametersChange,
    fetchVersionInfo,
    fetchExistingParameters,
  } = useParameterManagement({
    appId: appId || null,
    agentPKP: authInfo?.agentPKP,
    appInfo: app as unknown as any,
    onStatusChange: showStatus,
  });

  // Fetch version and existing parameters when app details are loaded
  useEffect(() => {
    const loadVersionAndParameters = async () => {
      if (!app || !appId || isLoading || !authInfo?.agentPKP || versionFetchedRef.current) return;

      try {
        versionFetchedRef.current = true;

        // Get the version information based on permitted version or latest version
        const versionToUse =
          app.permittedVersion !== null ? app.permittedVersion : app.latestVersion;

        console.log('Loading version info for version:', versionToUse);
        await fetchVersionInfo(Number(versionToUse));

        // Fetch existing parameters
        console.log('Fetching existing parameters...');
        await fetchExistingParameters();
      } catch (error) {
        console.error('Error loading version data or parameters:', error);
        versionFetchedRef.current = false; // Reset so we can try again
        showStatus('Failed to load application data. Please try refreshing the page.', 'error');
      }
    };

    loadVersionAndParameters();
  }, [app, appId, authInfo?.agentPKP, isLoading, fetchVersionInfo, fetchExistingParameters]);

  // Function to handle upgrading to the latest version
  const handleUpgradeToLatest = async () => {
    if (!appId || !authInfo?.agentPKP || !authInfo?.userPKP || !sessionSigs || !app) {
      showErrorWithStatus('Missing required data for version upgrade');
      return;
    }

    setIsUpgrading(true);

    try {
      // Use the shared upgrade utility
      const result = await upgradeAppToLatestVersion({
        appId,
        agentPKP: authInfo.agentPKP,
        userPKP: authInfo.userPKP,
        sessionSigs,
        currentVersion: app.permittedVersion,
        latestVersion: app.latestVersion,
        onStatusChange: showStatus,
        onError: showErrorWithStatus,
      });

      if (!result.success) {
        throw new Error(result.message || 'Upgrade failed');
      }

      // Reset version fetched ref so parameters are reloaded
      versionFetchedRef.current = false;

      // Update app state with new permitted version
      setApp((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          permittedVersion: prev.latestVersion,
        };
      });

      showStatus('Successfully upgraded to latest version! Refreshing parameters...', 'success');

      // Reload version info and parameters for the new version
      try {
        await fetchVersionInfo(Number(app.latestVersion));
        await fetchExistingParameters();
      } catch (error) {
        console.error('Error refreshing parameters after upgrade:', error);
        showStatus(
          'Upgrade successful, but some parameters may not be visible until you refresh',
          'warning',
        );
      }
    } catch (error) {
      console.error('Version upgrade failed:', error);
      showErrorWithStatus('Failed to upgrade to latest version', 'Upgrade Error');
    } finally {
      setIsUpgrading(false);
    }
  };

  // Load app details when component mounts
  useEffect(() => {
    if (!appId) {
      navigate('/');
      return;
    }

    // Only fetch app details after auth processing is complete
    if (!isProcessing) {
      loadAppDetails();
    }
  }, [appId, isProcessing]);

  // Fetch app details
  const loadAppDetails = async () => {
    setIsLoading(true);

    if (!sessionSigs || !authInfo?.agentPKP) {
      showErrorWithStatus('Authentication required. Please sign in again.');
      setIsLoading(false);
      setAuthFailed(true);
      return;
    }

    try {
      const appDetails = await fetchAppDetails(appId!, authInfo.agentPKP.tokenId);
      setApp(appDetails);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching app details:', error);
      if (error instanceof Error) {
        showErrorWithStatus(error.message, 'Application Error');
      } else {
        showErrorWithStatus('Failed to load application details', 'Application Error');
      }
      setIsLoading(false);
    }
  };

  // Handle form submission (approve)
  const handleApprove = async () => {
    if (!appId || !authInfo?.agentPKP || !authInfo?.userPKP || !sessionSigs || !versionInfo) {
      showErrorWithStatus('Missing required data for parameter update');
      return { success: false };
    }

    // Improved parameter comparison that checks if any actual changes were made to existing parameters
    let hasChanges = false;

    // Check if any existing parameters have been modified
    for (const existingParam of existingParameters) {
      // Find the corresponding parameter in the current form
      const formParam = parameters.find(
        (p) =>
          p.toolIndex === existingParam.toolIndex &&
          p.policyIndex === existingParam.policyIndex &&
          p.paramIndex === existingParam.paramIndex,
      );

      // If parameter exists in both existing and form, compare values
      if (formParam) {
        if (formParam.value !== existingParam.value) {
          hasChanges = true;
          break;
        }
      } else {
        hasChanges = true;
        break;
      }
    }

    // If no changes to existing parameters, check for new non-empty parameters
    if (!hasChanges) {
      for (const formParam of parameters) {
        // Check if this parameter is new (not in existing parameters)
        const existingParam = existingParameters.find(
          (ep) =>
            ep.toolIndex === formParam.toolIndex &&
            ep.policyIndex === formParam.policyIndex &&
            ep.paramIndex === formParam.paramIndex,
        );

        // Only consider it a change if this is a new parameter with an actual value
        if (
          !existingParam &&
          formParam.value !== undefined &&
          formParam.value !== null &&
          formParam.value !== ''
        ) {
          hasChanges = true;
          break;
        }
      }
    }

    if (!hasChanges) {
      showStatus('No changes detected. Parameters are already up to date.', 'success');
      return { success: true, noChanges: true };
    }

    setIsSaving(true);

    const result = await updateParametersForApp({
      appId,
      agentPKP: authInfo.agentPKP,
      userPKP: authInfo.userPKP,
      sessionSigs,
      parameters,
      versionInfo,
      litNodeClient,
      showStatus,
      showErrorWithStatus,
      onComplete: (success) => {
        setIsSaving(false);
        if (success) {
          showStatus('Parameters saved successfully! Refreshing page...', 'success');
          // Add delay before refreshing to show success message
          setTimeout(() => {
            navigate(0); // Refresh the page
          }, 1500);
        }
      },
    });

    return result;
  };

  // Handle back button
  const handleBack = () => {
    navigate('/apps');
  };

  // If auth failed, show a better UI
  if (authFailed) {
    return <ErrorState onBack={handleBack} />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (!app) {
    return <AppNotFound appId={appId} onBack={handleBack} />;
  }

  return (
    <div className="p-6">
      <StatusHandler statusMessage={statusMessage} statusType={statusType} />
      <AppHeader onBack={handleBack} />
      <AppInfoSection app={app} />

      {app && app.permittedVersion !== null && app.latestVersion > app.permittedVersion && (
        <VersionUpgradeSection
          app={app}
          isUpgrading={isUpgrading}
          versionStatusText={versionStatusText}
          shouldDisableUpgrade={shouldDisableUpgrade}
          onUpgrade={handleUpgradeToLatest}
        />
      )}

      <ParameterSettingsSection
        versionInfo={versionInfo}
        isLoading={isLoading}
        existingParameters={existingParameters}
        isSaving={isSaving}
        isUpgrading={isUpgrading}
        onParametersChange={handleParametersChange}
        onApprove={handleApprove}
      />
    </div>
  );
}

// Wrap the component with providers and layout
const AppDetailsPageWrapped = () => {
  const handleSignOut = (ConsentView as any).handleSignOut;
  const WrappedAppDetailsPage = wrap(AppDetailsPage, [...UserProviders]);

  return (
    <UserLayout onSignOut={handleSignOut}>
      <WrappedAppDetailsPage />
    </UserLayout>
  );
};

export default AppDetailsPageWrapped;
