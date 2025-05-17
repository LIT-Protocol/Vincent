import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { BigNumber } from 'ethers';
import { AppDetails } from '../consent/types';
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
}: {
  userPKP: IRelayPKP | null;
  sessionSigs: SessionSigs | null;
  agentPKP: IRelayPKP | null;
  showStatus: (message: string, type?: 'info' | 'warning' | 'success' | 'error') => void;
}): Promise<{
  apps: AppDetails[];
  error?: string;
}> {
  // Skip if missing dependencies
  if (!userPKP || !sessionSigs || !agentPKP) {
    return { apps: [], error: 'Missing required authentication. Please reconnect your wallet.' };
  }

  try {
    const userViewContract = getUserViewRegistryContract();
    const appViewContract = getAppViewRegistryContract();

    const appIds = await userViewContract.getAllPermittedAppIdsForPkp(agentPKP.tokenId);

    if (!appIds || appIds.length === 0) {
      showStatus("You haven't authorized any applications yet", 'warning');
      return { apps: [] };
    }

    const appDetailsResults = await Promise.all(
      appIds.map(async (appId: BigNumber) => {
        const appIdNumber = appId.toNumber();

        const [appInfo, permittedVersion] = await Promise.all([
          appViewContract.getAppById(appIdNumber),
          userViewContract.getPermittedAppVersionForPkp(agentPKP.tokenId, appIdNumber),
        ]);

        const currentVersion = parseInt(permittedVersion._hex, 16);
        const latestVersion = parseInt(appInfo.latestVersion._hex, 16);

        const versionResponses = await Promise.all([
          appViewContract.getAppVersion(Number(appId), currentVersion),
          appViewContract.getAppVersion(Number(appId), latestVersion),
        ]);

        const [, currentVersionData] = versionResponses[0];
        const [, latestVersionData] = versionResponses[1];

        const isCurrentVersionEnabled = currentVersionData.enabled;
        const isLatestVersionEnabled = latestVersionData.enabled;

        const { showInfo, infoMessage } = generateVersionInfo(
          currentVersion,
          latestVersion,
          isCurrentVersionEnabled,
          isLatestVersionEnabled,
        );

        return {
          id: appIdNumber.toString(),
          name: appInfo.name,
          description: appInfo.description,
          deploymentStatus: appInfo.deploymentStatus,
          version: currentVersion,
          isDeleted: appInfo.isDeleted,
          showInfo,
          infoMessage,
        };
      }),
    );

    const sortedApps = appDetailsResults.sort((a, b) => {
      if (a.isDeleted !== b.isDeleted) {
        return a.isDeleted ? 1 : -1;
      }

      return a.name.localeCompare(b.name);
    });

    return { apps: sortedApps };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      apps: [],
      error: `Error fetching user apps: ${errorMessage}`,
    };
  }
}
