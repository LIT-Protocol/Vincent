import { useState, useCallback, useEffect, useRef } from 'react';
import { IRelayPKP } from '@lit-protocol/types';
import * as ethers from 'ethers';
import { 
  getAppViewRegistryContract, 
  getUserViewRegistryContract 
} from '../utils/contracts';
import { AppView } from '../types';

interface UseAppPermissionCheckProps {
  appId: string | null;
  agentPKP?: IRelayPKP;
  redirectUri: string | null;
  generateJWT?: (appInfo: AppView) => Promise<string | null>;
  redirectWithJWT?: (jwt: string | null) => void;
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
  onStatusChange
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
    isAppDeleted: false
  });
  
  // Ref to track if permission check has been done, track if we've previously seen a null appId
  const permissionCheckedRef = useRef(false);
  const hadNullAppIdRef = useRef(appId === null);
  
  /**
   * Updates specific fields in the permission state object while preserving other values.
   * This prevents unnecessary re-renders by only updating what has changed.
   */
  const updateState = useCallback((updates: Partial<AppPermissionState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);
  
  /**
   * Verifies if the redirect URI is authorized for this app.
   * Checks if the provided redirectUri matches any URI in the app's authorizedRedirectUris list.
   */
  const verifyUri = useCallback(async (appInfo: AppView): Promise<boolean> => {
    if (!redirectUri) {
      return false;
    }
    
    try {
      const isAuthorized = appInfo?.authorizedRedirectUris?.some(uri => {
        return uri === redirectUri;
      }) || false;
      
      return isAuthorized;
    } catch (e) {
      console.error('Error verifying redirect URI:', e);
      return false;
    }
  }, [redirectUri]);
  
  /**
   * Handles the flow when a user chooses to continue with an existing permission.
   * Generates a JWT token and redirects the user to the appropriate URI.
   */
  const continueWithExistingPermission = useCallback(async () => {
    if (!generateJWT || !redirectWithJWT) {
      console.error('Missing JWT functions for continuing with existing permission');
      return;
    }
    
    const { appInfo } = state;
    if (!appInfo) {
      console.error('Cannot continue with existing permission: Missing app info');
      return;
    }
    
    if (!redirectUri) {
      console.error('Cannot continue with existing permission: Missing redirect URI');
      return;
    }
    
    try {
      updateState({ showingAuthorizedMessage: true });
      onStatusChange?.('Continuing with existing permission...', 'info');
      
      onStatusChange?.('Generating authentication token...', 'info');
      const jwt = await generateJWT(appInfo);
      
      setTimeout(() => {
        updateState({ showSuccess: true });
        onStatusChange?.('Permission verified! Redirecting...', 'success');
        
        setTimeout(() => {
          redirectWithJWT(jwt);
        }, 1000);
      }, 2000);
    } catch (error) {
      console.error('Error in continue with existing permission flow:', error);
      onStatusChange?.('An error occurred while processing your request. Please try again.', 'error');
      updateState({ showingAuthorizedMessage: false });
    }
  }, [redirectUri, generateJWT, redirectWithJWT, onStatusChange, updateState, state.appInfo]);
  
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
      checkingPermissions: false
    });

    if (fetchExistingParameters) {
      try {
        console.log('Fetching existing parameters for version upgrade');
        fetchExistingParameters().catch(error => {
          console.error('Error fetching parameters for version upgrade:', error);
        });
      } catch (error) {
        console.error('Error calling fetchExistingParameters:', error);
      }
    }
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
    if (!appId || !agentPKP) {
      return;
    }

    if (permissionCheckedRef.current) {
      updateState({ checkingPermissions: false });
      return;
    }

    permissionCheckedRef.current = true;
    onStatusChange?.('Checking app permissions...', 'info');

    try {
      const userViewRegistryContract = getUserViewRegistryContract();
      const permittedAppIds =
        await userViewRegistryContract.getAllPermittedAppIdsForPkp(
          agentPKP.tokenId
        );

      const appViewRegistryContract = getAppViewRegistryContract();
      const appRawInfo = await appViewRegistryContract.getAppById(Number(appId));

      updateState({ appInfo: appRawInfo });
      
      // Check if the app is deleted
      if (appRawInfo.isDeleted) {
        console.log('App is deleted. Preventing access.');
        updateState({
          isAppDeleted: true,
          checkingPermissions: false,
          isLoading: false
        });
        onStatusChange?.('This application has been deleted by its creator', 'error');
        return;
      }

      const isUriVerified = await verifyUri(appRawInfo);
      
      if (!isUriVerified) {
        updateState({
          isUriUntrusted: true,
          checkingPermissions: false,
          isLoading: false
        });
        return;
      }

      const appIdNum = Number(appId);
      const isPermitted = permittedAppIds.some(
        (id: ethers.BigNumber) => id.toNumber() === appIdNum
      );

      console.log('Is app already permitted?', isPermitted);
      updateState({ isAppAlreadyPermitted: isPermitted });

      if (isPermitted && redirectUri) {
        // Check if the app version is permitted
        try {
          const permittedAppVersion = await getUserViewRegistryContract().getPermittedAppVersionForPkp(
            agentPKP.tokenId,
            appIdNum
          );
          
          const permittedVersionNum = permittedAppVersion.toNumber();
          const latestVersionNum = Number(appRawInfo.latestVersion);
          
          updateState({ permittedVersion: permittedVersionNum });
          
          console.log(`PKP ${agentPKP.tokenId} has permission for app ${appIdNum} version ${permittedVersionNum}`);
          console.log(`Latest available version for app ${appIdNum} is ${latestVersionNum}`);
          
          if (permittedVersionNum < latestVersionNum) {
            console.log(`Current permission (v${permittedVersionNum}) needs upgrade to v${latestVersionNum}`);
            updateState({
              showVersionUpgradePrompt: true,
              isLoading: false,
              checkingPermissions: false
            });
            return;
          }
          
          // Fetch existing parameters if the function is provided
          if (fetchExistingParameters) {
            try {
              console.log('About to fetch existing parameters');
              await fetchExistingParameters();
              console.log('Successfully fetched existing parameters');
            } catch (error) {
              console.error('Error fetching parameters:', error);
              // Continue even if fetching parameters fails
            }
          }
          
          updateState({
            showUpdateModal: true,
            isLoading: false,
            checkingPermissions: false
          });
          return;
        } catch (versionError) {
          console.error('Error checking permitted version:', versionError);
          // Continue with normal flow if we can't check the version
        }
        
        // Only reach here if version check failed
        console.log('App is already permitted with latest version. Generating JWT and redirecting...');
        
        if (!state.showUpdateModal && generateJWT && redirectWithJWT) {
          updateState({ showingAuthorizedMessage: true });
          const jwt = await generateJWT(appRawInfo);
          
          setTimeout(() => {
            updateState({ showSuccess: true });
            
            setTimeout(() => {
              redirectWithJWT(jwt);
            }, 1000);
          }, 2000);
        }
      }

      updateState({
        isLoading: false,
        checkingPermissions: false
      });
    } catch (error) {
      console.error('Error in checkAppPermission:', error);
      onStatusChange?.('Error checking app permissions', 'error');
      updateState({ 
        isLoading: false,
        checkingPermissions: false
      });
    }
  }, [
    appId,
    agentPKP,
    redirectUri,
    verifyUri,
    updateState,
    generateJWT,
    redirectWithJWT,
    fetchExistingParameters,
    onStatusChange
  ]);
  
  /**
   * Triggers the permission check when appId becomes available.
   * This is important because appId might be null on initial component mount,
   * but become available later after URL parameters are parsed.
   */
  useEffect(() => {
    // If we have an appId (not null) and either:
    // 1. We previously had null appId (component just loaded) OR
    // 2. We haven't checked permissions yet
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
    if (state.showUpdateModal) {
      updateState({
        showingAuthorizedMessage: false,
        showSuccess: false
      });
    }
  }, [state.showUpdateModal, updateState]);
  
  return {
    ...state,
    continueWithExistingPermission,
    handleUpgrade,
    updateState
  };
}; 