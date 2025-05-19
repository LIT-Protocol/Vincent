import { useState, useCallback, useEffect, useRef } from 'react';
import { IRelayPKP } from '@lit-protocol/types';
import * as ethers from 'ethers';
import {
  getAppViewRegistryContract,
  getUserViewRegistryContract,
} from '../../utils/user-dashboard/contracts';
import { AppView } from '@/types';

interface UseAppPermissionCheckProps {
  appId: string | null;
  agentPKP?: IRelayPKP;
  redirectUri?: string | null;
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
  isAppNotFound: boolean;
}

/**
 * This hook manages the app permission checking process, determining whether a PKP
 * has permission to use an app, verifying redirect URIs, handling version upgrades,
 * and managing the various states throughout the permission flow.
 */
export const useUserAppPermissionCheck = ({
  appId,
  agentPKP,
  redirectUri,
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
    isAppNotFound: false,
  });

  // Ref to track if permission check has been done, track if we've previously seen a null appId
  const permissionCheckedRef = useRef(false);
  const hadNullAppIdRef = useRef(appId === null);

  /**
   * Updates specific fields in the permission state object while preserving other values.
   * This prevents unnecessary re-renders by only updating what has changed.
   */
  const updateState = useCallback((updates: Partial<AppPermissionState>) => {
    setState((prev) => {
      const needsUpdate = Object.entries(updates).some(
        ([key, value]) => prev[key as keyof AppPermissionState] !== value,
      );

      if (!needsUpdate) {
        return prev;
      }

      return { ...prev, ...updates };
    });
  }, []);

  /**
   * Handles the case when a user wants to upgrade to a newer version of the app.
   * Resets the version upgrade prompt and sets up state for the permission process.
   */
  const handleUpgrade = useCallback(() => {
    updateState({
      showVersionUpgradePrompt: false,
      isAppAlreadyPermitted: false,
      checkingPermissions: false,
      useCurrentVersionOnly: false,
      permittedVersion: null,
    });

    setTimeout(() => {
      updateState({
        isLoading: false,
      });
    }, 100);
  }, [updateState]);

  /**
   * Verifies if the redirect URI is authorized for this app.
   * Checks if the provided redirectUri matches any URI in the app's authorizedRedirectUris list.
   * Only runs when redirectUri is provided.
   */
  const verifyUri = useCallback(
    async (appInfo: AppView): Promise<boolean> => {
      if (!redirectUri) {
        return true;
      }

      try {
        const isAuthorized =
          appInfo?.authorizedRedirectUris?.some((uri) => {
            return uri === redirectUri;
          }) || false;

        return isAuthorized;
      } catch {
        return false;
      }
    },
    [redirectUri],
  );

  /**
   * The main function that checks if a PKP has permission for an app.
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

    // TRY-CATCH #1: Main try-catch for the entire permission check process
    try {
      // Fetch all data in parallel where possible
      const userViewRegistryContract = getUserViewRegistryContract();
      const appViewRegistryContract = getAppViewRegistryContract();

      // Launch multiple contract calls in parallel for better performance
      const [permittedAppIds, appRawInfo] = await Promise.all([
        userViewRegistryContract.getAllPermittedAppIdsForPkp(agentPKP.tokenId),
        appViewRegistryContract.getAppById(Number(appId)),
      ]);

      // IF #3: Check if app exists
      if (!appRawInfo) {
        onStatusChange?.('App not found. Please make sure the app exists.', 'error');
        updateState({
          isLoading: false,
          checkingPermissions: false,
          isAppNotFound: true,
        });
        return;
      }

      // Collect all state updates in a single object
      const stateUpdates: Partial<AppPermissionState> = {
        appInfo: appRawInfo,
        isLoading: false, // Set isLoading false only ONCE at the end
        checkingPermissions: false,
      };

      // IF #4: Check if app is deleted
      if (appRawInfo.isDeleted) {
        console.log('App is deleted. Preventing access.');
        updateState({
          ...stateUpdates,
          isAppDeleted: true,
        });
        onStatusChange?.('This application has been deleted by its creator', 'error');
        return;
      }

      // Check URI verification if redirectUri exists
      if (redirectUri) {
        const isUriVerified = await verifyUri(appRawInfo);

        if (!isUriVerified) {
          updateState({
            ...stateUpdates,
            isUriUntrusted: true,
          });
          return;
        }
      }

      const appIdNum = Number(appId);
      const isPermitted = permittedAppIds.some(
        (id: ethers.BigNumber) => id.toNumber() === appIdNum,
      );

      stateUpdates.isAppAlreadyPermitted = isPermitted;

      // IF #6: Check if app is not permitted
      if (!isPermitted) {
        updateState(stateUpdates);
        return;
      }

      // App is permitted - check version
      try {
        const permittedAppVersion =
          await getUserViewRegistryContract().getPermittedAppVersionForPkp(
            agentPKP.tokenId,
            appIdNum,
          );

        const permittedVersionNum = permittedAppVersion.toNumber();
        const latestVersionNum = Number(appRawInfo.latestVersion);

        stateUpdates.permittedVersion = permittedVersionNum;

        // IF #7: Check if version upgrade is needed
        if (permittedVersionNum < latestVersionNum) {
          updateState({
            ...stateUpdates,
            showVersionUpgradePrompt: true,
          });
        } else {
          // Proceed with modal display
          updateState({
            ...stateUpdates,
            showUpdateModal: true,
          });
        }
      } catch (error: unknown) {
        console.error('Error checking permitted version:', error);
        onStatusChange?.('Error checking permitted version', 'error');
        updateState(stateUpdates);
      }
    } catch (error) {
      // Main error handler for the entire function
      console.error('Error in checkAppPermission:', error);
      onStatusChange?.('Error checking app permissions. Please make sure the app exists.', 'error');
      updateState({
        isLoading: false,
        checkingPermissions: false,
        isAppNotFound: true,
      });
    }
  }, [appId, agentPKP, redirectUri, verifyUri, updateState, onStatusChange]);

  /**
   * Triggers the permission check when appId becomes available.
   * This is important because appId might be null on initial component mount,
   * but become available later after URL parameters are parsed.
   */
  useEffect(() => {
    // IF #1: Check if we have appId and should run permission check
    if (appId && (hadNullAppIdRef.current || !permissionCheckedRef.current)) {
      hadNullAppIdRef.current = false;
      // Don't change isLoading here - let the checkAppPermission function handle it
      checkAppPermission();
    }
  }, [appId, checkAppPermission]);

  /**
   * Resets UI flags when the update modal is displayed without touching isLoading.
   * This ensures that success and authorization messages don't appear
   * simultaneously with the update modal.
   */
  useEffect(() => {
    // IF #1: Reset UI flags when update modal is shown
    if (state.showUpdateModal) {
      updateState({
        showingAuthorizedMessage: false,
        showSuccess: false,
        // Don't modify isLoading here to avoid toggle
      });
    }
  }, [state.showUpdateModal, updateState]);

  return {
    ...state,
    handleUpgrade,
    updateState,
  };
};
