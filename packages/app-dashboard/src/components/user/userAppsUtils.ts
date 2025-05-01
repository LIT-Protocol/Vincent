import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { BigNumber } from 'ethers';
import { AppDetails } from '@/components/user/types';
import {
  getAppViewRegistryContract,
  getUserViewRegistryContract,
} from '../consent/utils/contracts';

/**
 * Generate a status message for version enabled/disabled states
 */
function generateVersionInfo(
  currentVersion: number,
  latestVersion: number,
  isCurrentVersionEnabled: boolean,
  isLatestVersionEnabled: boolean,
): { showInfo: boolean; infoMessage?: string } {
  let showInfo = false;
  let infoMessage: string | undefined = undefined;

  if (isCurrentVersionEnabled === false && isLatestVersionEnabled === false) {
    showInfo = true;
    infoMessage = `Both your current version (${currentVersion}) and the latest version have been disabled by the app developer.`;
  } else if (isLatestVersionEnabled === false) {
    showInfo = true;
    infoMessage = `The latest version of this application is currently disabled by the developer.`;
  } else if (isCurrentVersionEnabled === false) {
    showInfo = true;
    infoMessage = `Version ${currentVersion} has been disabled by the app developer. To continue using the app, please update to the latest version.`;
  } else if (latestVersion > currentVersion) {
    showInfo = true;
    infoMessage = `Version ${latestVersion} is available (you're using v${currentVersion}).`;
  }

  return { showInfo, infoMessage };
}

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
  showStatus: (message: string, type?: 'info' | 'warning' | 'success' | 'error') => void;
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
    const userViewContract = getUserViewRegistryContract();
    const appViewContract = getAppViewRegistryContract();

    const appIds = await userViewContract.getAllPermittedAppIdsForPkp(agentPKP.tokenId);

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
          agentPKP.tokenId,
          appIdNumber,
        );
        const currentVersion = parseInt(permittedVersion._hex, 16);
        const latestVersion = parseInt(appInfo.latestVersion._hex, 16);

        // Get version data to check if versions are enabled
        const [, currentVersionData] = await appViewContract.getAppVersion(
          Number(appId),
          currentVersion,
        );
        const [, latestVersionData] = await appViewContract.getAppVersion(
          Number(appId),
          latestVersion,
        );

        const isCurrentVersionEnabled = currentVersionData.enabled;
        const isLatestVersionEnabled = latestVersionData.enabled;

        const showUpgradePrompt = currentVersion !== null && latestVersion > currentVersion;

        // Generate version info
        const { showInfo, infoMessage } = generateVersionInfo(
          currentVersion,
          latestVersion,
          isCurrentVersionEnabled,
          isLatestVersionEnabled,
        );

        // Create AppDetails from app info
        return {
          id: appIdNumber.toString(),
          name: appInfo.name,
          description: appInfo.description,
          deploymentStatus: appInfo.deploymentStatus,
          version: currentVersion,
          isDeleted: appInfo.isDeleted,
          latestVersion,
          showUpgradePrompt,
          showInfo,
          infoMessage,
        };
      } catch (err) {
        console.warn(`Error fetching details for app ${appId}:`, err);
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
