import { useState, useCallback, useEffect, useRef } from 'react';
import { IRelayPKP } from '@lit-protocol/types';
import * as ethers from 'ethers';
import {
  getAppViewRegistryContract,
  getUserViewRegistryContract,
} from '@/utils/user-dashboard/contracts';
import { AppView } from '@/types';

interface UseAppPermissionCheckProps {
  appId: string | null;
  agentPKP?: IRelayPKP;
  redirectUri: string | null;
  generateJWT?: (appId: string, appVersion: number, appInfo: AppView) => Promise<string>;
  redirectWithJWT?: (jwt: string) => void;
  fetchExistingParameters?: () => Promise<void>;
  onStatusChange?: (message: string, type?: 'info' | 'warning' | 'success' | 'error') => void;
}

interface AppPermissionState {
  appInfo: AppView | null;
  isAppAlreadyPermitted: boolean;
  isUriUntrusted: boolean;
  showVersionUpgradePrompt: boolean;
  showUpdateModal: boolean;
  permittedVersion: number | null;
  showingAuthorizedMessage: boolean;
  showSuccess: boolean;
  showDisapproval: boolean;
  isLoading: boolean;
  checkingPermissions: boolean;
  useCurrentVersionOnly?: boolean;
  isAppDeleted: boolean;
}

/**
 * This hook manages the app permission checking process, determining whether a PKP
 * has permission to use an app, verifying redirect URIs, handling version upgrades,
 * and managing the various states throughout the permission flow.
 */
export const useAppPermissionCheck = ({
  appId,
  agentPKP,
  redirectUri,
  generateJWT,
  redirectWithJWT,
  fetchExistingParameters,
  onStatusChange,
}: UseAppPermissionCheckProps) => {
  // State to track various permission-related flags
  const [state, setState] = useState<AppPermissionState>({
    appInfo: null,
    isAppAlreadyPermitted: false,
    isUriUntrusted: false,
    showVersionUpgradePrompt: false,
    showUpdateModal: false,
    permittedVersion: null,
    showingAuthorizedMessage: false,
    showSuccess: false,
    showDisapproval: false,
    isLoading: true,
    checkingPermissions: true,
    useCurrentVersionOnly: false,
    isAppDeleted: false,
  });

  // Ref to track if permission check has been done, track if we've previously seen a null appId
  const permissionCheckedRef = useRef(false);
  const hadNullAppIdRef = useRef(appId === null);

  /**
   * Updates specific fields in the permission state object while preserving other values.
   * This prevents unnecessary re-renders by only updating what has changed.
   */
  const updateState = useCallback((updates: Partial<AppPermissionState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Verifies if the redirect URI is authorized for this app.
   * Checks if the provided redirectUri matches any URI in the app's authorizedRedirectUris list.
   */
  const verifyUri = useCallback(
    async (appInfo: AppView): Promise<boolean> => {
      if (!redirectUri) {
        return false;
      }

      try {
        const isAuthorized =
          appInfo?.authorizedRedirectUris?.some((uri) => {
            return uri === redirectUri;
          }) || false;

        return isAuthorized;
      } catch (e) {
        console.error('Error verifying redirect URI:', e);
        return false;
      }
    },
    [redirectUri],
  );

  /**
   * Handles the flow when a user chooses to continue with an existing permission.
   * Generates a JWT token and redirects the user to the appropriate URI.
   */
  const continueWithExistingPermission = useCallback(async () => {
    // IF #1: Check if JWT functions are available
    if (!generateJWT || !redirectWithJWT) {
      console.error('Missing JWT functions for continuing with existing permission');
      return;
    }

    const { appInfo, permittedVersion } = state;
    // IF #2: Check if app info exists
    if (!appId || !appInfo || !permittedVersion) {
      console.error(
        'Cannot continue with existing permission: Missing app id, app info or permitted version',
      );
      return;
    }

    // IF #3: Check if redirect URI exists
    if (!redirectUri) {
      console.error('Cannot continue with existing permission: Missing redirect URI');
      return;
    }

    // TRY-CATCH #1: Handle the JWT generation and redirect flow
    try {
      updateState({ showingAuthorizedMessage: true });
      onStatusChange?.('Continuing with existing permission...', 'info');

      onStatusChange?.('Generating authentication token...', 'info');
      const jwt = await generateJWT(appId, permittedVersion, appInfo);

      setTimeout(() => {
        updateState({ showSuccess: true });
        onStatusChange?.('Permission verified! Redirecting...', 'success');

        setTimeout(() => {
          redirectWithJWT(jwt);
        }, 1000);
      }, 2000);
    } catch (error) {
      console.error('Error in continue with existing permission flow:', error);
      onStatusChange?.(
        'An error occurred while processing your request. Please try again.',
        'error',
      );
      updateState({ showingAuthorizedMessage: false });
    }
  }, [appId, redirectUri, generateJWT, redirectWithJWT, onStatusChange, updateState, state]);

  /**
   * Handles the case when a user wants to upgrade to a newer version of the app.
   * Resets the version upgrade prompt and sets up state for the permission process.
   * If fetchExistingParameters is provided, it will fetch existing parameters
   * to preserve values when upgrading to a new version.
   */
  const handleUpgrade = useCallback(() => {
    updateState({
      showVersionUpgradePrompt: false,
      isAppAlreadyPermitted: false,
      isLoading: true,
      checkingPermissions: false,
      useCurrentVersionOnly: false,
    });

    setTimeout(async () => {
      try {
        if (fetchExistingParameters) {
          await fetchExistingParameters();
        }

        updateState({
          isLoading: false,
          checkingPermissions: false,
        });
      } catch (error) {
        console.error('Error fetching parameters for version upgrade:', error);
        updateState({
          isLoading: false,
          checkingPermissions: false,
        });
      }
    }, 100);
  }, [updateState, fetchExistingParameters]);

  /**
   * The main function that checks if a PKP has permission for an app.
   * This function:
   * 1. Fetches app information
   * 2. Verifies the redirect URI is trusted
   * 3. Checks if the app is already permitted
   * 4. Handles version upgrades if needed
   * 5. Sets the appropriate UI state based on the check results
   */
  const checkAppPermission = useCallback(async () => {
    // IF #1: Early return if missing required inputs
    if (!appId || !agentPKP) {
      return;
    }

    // IF #2: Skip if we've already checked permissions
    if (permissionCheckedRef.current) {
      updateState({ checkingPermissions: false });
      return;
    }

    permissionCheckedRef.current = true;
    onStatusChange?.('Checking app permissions...', 'info');

    // TRY-CATCH #1: Main try-catch for the entire permission check process
    try {
      const userViewRegistryContract = getUserViewRegistryContract();
      const permittedAppIds = await userViewRegistryContract.getAllPermittedAppIdsForPkp(
        agentPKP.tokenId,
      );

      const appViewRegistryContract = getAppViewRegistryContract();
      const appRawInfo = await appViewRegistryContract.getAppById(Number(appId));

      // IF #3: Check if app exists
      if (!appRawInfo) {
        onStatusChange?.('App not found. Please make sure the app exists.', 'error');
        updateState({
          isLoading: false,
          checkingPermissions: false,
        });
        return;
      }

      updateState({ appInfo: appRawInfo });

      // IF #4: Check if app is deleted
      if (appRawInfo.isDeleted) {
        console.log('App is deleted. Preventing access.');
        updateState({
          isAppDeleted: true,
          checkingPermissions: false,
          isLoading: false,
        });
        onStatusChange?.('This application has been deleted by its creator', 'error');
        return;
      }

      const isUriVerified = await verifyUri(appRawInfo);

      // IF #5: Check if redirect URI is trusted
      if (!isUriVerified) {
        updateState({
          isUriUntrusted: true,
          checkingPermissions: false,
          isLoading: false,
        });
        return;
      }

      const appIdNum = Number(appId);
      const isPermitted = permittedAppIds.some(
        (id: ethers.BigNumber) => id.toNumber() === appIdNum,
      );

      updateState({ isAppAlreadyPermitted: isPermitted });

      // IF #6: Check if app is permitted and we have redirect URI
      if (!isPermitted || !redirectUri) {
        updateState({
          isLoading: false,
          checkingPermissions: false,
        });
        return;
      }

      // App is permitted and we have a redirect URI - check version
      let permittedVersionNum;
      let latestVersionNum;

      // TRY-CATCH #2: For version checking
      try {
        const permittedAppVersion =
          await getUserViewRegistryContract().getPermittedAppVersionForPkp(
            agentPKP.tokenId,
            appIdNum,
          );

        permittedVersionNum = permittedAppVersion.toNumber();
        latestVersionNum = Number(appRawInfo.latestVersion);

        updateState({ permittedVersion: permittedVersionNum });
      } catch (error: unknown) {
        console.error('Error checking permitted version:', error);
        onStatusChange?.('Error checking permitted version', 'error');
        updateState({
          checkingPermissions: false,
          isLoading: false,
        });
        return;
      }

      // IF #7: Check if version upgrade is needed
      if (permittedVersionNum < latestVersionNum) {
        updateState({
          showVersionUpgradePrompt: true,
          isLoading: false,
          checkingPermissions: false,
        });
        return;
      }

      // IF #8: Check if we need to fetch existing parameters
      if (fetchExistingParameters) {
        // TRY-CATCH #3: For fetching existing parameters
        try {
          await fetchExistingParameters();
        } catch (error: unknown) {
          // Just log and continue - no need to throw or nest
          console.error('Error fetching existing parameters:', error);
          onStatusChange?.('Warning: Could not fetch existing parameters', 'warning');
          // Continue with the flow even if parameter fetching fails
        }
      }

      // Proceed with modal display
      updateState({
        showUpdateModal: true,
        isLoading: false,
        checkingPermissions: false,
      });
    } catch (error) {
      // Main error handler for the entire function
      console.error('Error in checkAppPermission:', error);
      onStatusChange?.('Error checking app permissions. Please make sure the app exists.', 'error');
      updateState({
        isLoading: false,
        checkingPermissions: false,
      });
    }
  }, [
    appId,
    agentPKP,
    redirectUri,
    verifyUri,
    updateState,
    fetchExistingParameters,
    onStatusChange,
  ]);

  /**
   * Triggers the permission check when appId becomes available.
   * This is important because appId might be null on initial component mount,
   * but become available later after URL parameters are parsed.
   */
  useEffect(() => {
    // IF #1: Check if we have appId and should run permission check
    if (appId && (hadNullAppIdRef.current || !permissionCheckedRef.current)) {
      hadNullAppIdRef.current = false;
      checkAppPermission();
    }
  }, [appId, checkAppPermission]);

  /**
   * Resets UI flags when the update modal is displayed.
   * This ensures that success and authorization messages don't appear
   * simultaneously with the update modal.
   */
  useEffect(() => {
    // IF #1: Reset UI flags when update modal is shown
    if (state.showUpdateModal) {
      updateState({
        showingAuthorizedMessage: false,
        showSuccess: false,
      });
    }
  }, [state.showUpdateModal, updateState]);

  return {
    ...state,
    continueWithExistingPermission,
    handleUpgrade,
    updateState,
  };
};
