import * as ethers from 'ethers';
import { LIT_RPC } from '@lit-protocol/constants';
import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { BigNumber } from 'ethers';
import { env } from '@/config/env';
import USER_VIEW_FACET_ABI from '@/services/contract/abis/VincentUserViewFacet.abi.json';
import APP_VIEW_FACET_ABI from '@/services/contract/abis/VincentAppViewFacet.abi.json';
import { AppDetails } from '@/components/user/types';

type StatusType = 'info' | 'warning' | 'success' | 'error';

/**
 * Fetches all permitted applications for a user's PKP
 */
export async function fetchUserApps({
  userPKP,
  sessionSigs,
  agentPKP,
  showStatus,
  showErrorWithStatus,
}: {
  userPKP: IRelayPKP | null;
  sessionSigs: SessionSigs | null;
  agentPKP: IRelayPKP | null;
  showStatus: (message: string, type?: StatusType) => void;
  showErrorWithStatus: (errorMessage: string, title?: string, details?: string) => void;
}): Promise<{
  apps: AppDetails[];
  isError: boolean;
}> {
  // Skip if missing dependencies
  if (!userPKP || !sessionSigs || !agentPKP) {
    showErrorWithStatus('Missing required authentication. Please reconnect your wallet.', 'error');
    return { apps: [], isError: true };
  }

  try {
    // Get contract address from env
    const contractAddress = env.VITE_VINCENT_DATIL_CONTRACT;

    // Set up provider
    const provider = new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE);

    // Create contract instances
    const userViewContract = new ethers.Contract(contractAddress, USER_VIEW_FACET_ABI, provider);

    const appViewContract = new ethers.Contract(contractAddress, APP_VIEW_FACET_ABI, provider);

    const tokenId = agentPKP.tokenId;

    // Get all permitted app IDs for the agent PKP
    console.log('Fetching apps for agent address:', tokenId);
    const appIds = await userViewContract.getAllPermittedAppIdsForPkp(tokenId);
    console.log('appIds', appIds);

    if (!appIds || appIds.length === 0) {
      showStatus("You haven't authorized any applications yet", 'info');
      return { apps: [], isError: false };
    }

    const appDetailsPromises = appIds.map(async (appId: BigNumber) => {
      try {
        // Get app ID as a number for using in other API calls
        const appIdNumber = appId.toNumber();

        // Get the app info using the app ID
        const appInfo = await appViewContract.getAppById(appIdNumber);
        console.log('appInfo', appInfo);

        // Get the permitted version for this PKP and app
        const permittedVersion = await userViewContract.getPermittedAppVersionForPkp(
          tokenId,
          appIdNumber,
        );
        console.log('permittedVersion', permittedVersion);

        // Convert versions to numbers
        const currentVersion = parseInt(permittedVersion._hex, 16);
        console.log('currentVersion', permittedVersion);

        // App info should have .latestVersion._hex
        const latestVersion = parseInt(appInfo.latestVersion._hex, 16);
        console.log('latestVersion', latestVersion);

        // Check if upgrade is available
        const showUpgradePrompt = currentVersion !== null && latestVersion > currentVersion;

        // Create AppDetails from app info
        return {
          id: appIdNumber.toString(),
          name: appInfo.name,
          description: appInfo.description,
          deploymentStatus: appInfo.deploymentStatus,
          managementWallet: appInfo.manager,
          version: currentVersion,
          isDeleted: appInfo.isDeleted,
          latestVersion,
          delegatees: appInfo.delegatees,
          authorizedRedirectUris: appInfo.authorizedRedirectUris,
          showUpgradePrompt,
        };
      } catch (err) {
        console.warn(`Error fetching details for app ${appId}:`, err);
        // If we get here, create a fallback app with error information
        let appIdStr = 'Unknown';
        try {
          appIdStr = appId.toString();
        } catch (e) {
          console.error('Could not convert appId to string', e);
        }

        return {
          id: appIdStr,
          name: `App ${appIdStr}`,
          description: 'Unable to load app details',
          deploymentStatus: 0,
          managementWallet: '',
          version: null,
          isDeleted: false,
          latestVersion: null,
          delegatees: [],
          authorizedRedirectUris: [],
          showUpgradePrompt: false,
        };
      }
    });

    const appDetails = await Promise.all(appDetailsPromises);

    // Filter out any undefined or null values
    const filteredAppDetails = appDetails.filter((app) => app !== undefined && app !== null);

    // Sort apps: active apps first (non-deleted), then by name
    const sortedApps = filteredAppDetails.sort((a, b) => {
      // First sort by deleted status
      if (a.isDeleted !== b.isDeleted) {
        return a.isDeleted ? 1 : -1;
      }

      // Then sort alphabetically by name
      return a.name.localeCompare(b.name);
    });

    return { apps: sortedApps, isError: false };
  } catch (error) {
    console.error('Error fetching user apps:', error);
    if (error instanceof Error) {
      showErrorWithStatus(error.message, 'Application Error');
    } else {
      showErrorWithStatus('Failed to load applications', 'Application Error');
    }
    return { apps: [], isError: true };
  }
}

/**
 * Updates an app's version in the apps array
 */
export function updateAppVersion(
  apps: AppDetails[],
  appId: string,
  newVersion: number,
): AppDetails[] {
  return apps.map((app) => {
    if (app.id === appId) {
      return {
        ...app,
        version: newVersion,
        showUpgradePrompt: false,
      };
    }
    return app;
  });
}
