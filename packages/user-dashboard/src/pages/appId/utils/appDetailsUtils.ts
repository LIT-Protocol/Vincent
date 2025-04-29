import { AppDetailsState } from '@/pages/appId/types';
import {
  getAppViewRegistryContract,
  getUserViewRegistryContract,
} from '@/components/consent/utils/contracts';

/**
 * Fetches app details from the registry contract
 */
export const fetchAppDetails = async (
  appId: string,
  agentPKPTokenId: string,
): Promise<AppDetailsState> => {
  const appViewContract = getAppViewRegistryContract();

  const appInfo = await appViewContract.getAppById(parseInt(appId));

  const userViewContract = getUserViewRegistryContract();
  const permittedVersion = await userViewContract.getPermittedAppVersionForPkp(
    agentPKPTokenId,
    parseInt(appId),
  );

  // Create app details object
  const appDetails: AppDetailsState = {
    id: appId,
    name: appInfo.name,
    description: appInfo.description,
    deploymentStatus: appInfo.deploymentStatus,
    isDeleted: appInfo.isDeleted,
    manager: appInfo.manager,
    latestVersion: parseInt(appInfo.latestVersion.toString()),
    permittedVersion: parseInt(permittedVersion.toString()),
    authorizedRedirectUris: appInfo.authorizedRedirectUris,
  };

  return appDetails;
};

/**
 * Get deployment status label based on status code
 */
export const getDeploymentStatusName = (status: number): string => {
  const deploymentStatusNames = ['DEV', 'TEST', 'PROD'];
  return deploymentStatusNames[status] || 'Unknown';
};

/**
 * Get the appropriate notice text based on version status
 */
export const getVersionStatusText = (
  app: AppDetailsState | null,
  isCurrentVersionEnabled: boolean | null,
  isLatestVersionEnabled: boolean | null,
): string | null => {
  if (!app || app.permittedVersion === null) return null;

  if (isCurrentVersionEnabled === false && isLatestVersionEnabled === false) {
    return `Both your current version (${app.permittedVersion}) and the latest version have been disabled by the app developer. Please contact the app developer for assistance.`;
  } else if (isLatestVersionEnabled === false) {
    return `The latest version of this application is currently disabled by the developer. You can continue using the current version.`;
  } else if (isCurrentVersionEnabled === false) {
    return `Version ${app.permittedVersion} has been disabled by the app developer. We recommend updating to the latest version.`;
  }

  return null;
};
