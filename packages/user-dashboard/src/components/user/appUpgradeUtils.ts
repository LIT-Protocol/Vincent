import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { upgradeAppToLatestVersion as upgradeAppBase } from '@/utils/upgradeUtils';
import { AppDetails } from '@/components/user/types';
import { updateAppVersion } from './userAppsUtils';

type StatusType = 'info' | 'warning' | 'success' | 'error';

/**
 * Upgrades an app to the latest version and returns updated app list
 */
export async function handleAppUpgrade({
  appId,
  userPKP,
  agentPKP,
  sessionSigs,
  apps,
  showStatus,
  showErrorWithStatus,
}: {
  appId: string;
  userPKP: IRelayPKP | null;
  agentPKP: IRelayPKP | null;
  sessionSigs: SessionSigs | null;
  apps: AppDetails[];
  showStatus: (message: string, type?: StatusType) => void;
  showErrorWithStatus: (errorMessage: string, title?: string, details?: string) => void;
}): Promise<{
  isSuccess: boolean;
  updatedApps?: AppDetails[];
}> {
  if (!userPKP || !agentPKP || !sessionSigs) {
    showErrorWithStatus('Missing required authentication data');
    return { isSuccess: false };
  }

  try {
    // Get the app details to find current and latest versions
    const appToUpgrade = apps.find((app) => app.id === appId);

    if (!appToUpgrade) {
      throw new Error('App not found');
    }

    const currentVersion = appToUpgrade.version ?? null;
    const latestVersion = appToUpgrade.latestVersion ?? null;

    if (currentVersion === null || latestVersion === null) {
      throw new Error('Missing version information');
    }

    await upgradeAppBase({
      appId,
      agentPKP,
      userPKP,
      sessionSigs,
      currentVersion,
      latestVersion,
      onStatusChange: showStatus,
      onError: showErrorWithStatus,
    });

    // Update the apps array with the new version
    const updatedApps = updateAppVersion(apps, appId, latestVersion);

    showStatus(`Successfully upgraded ${appToUpgrade.name} to v${latestVersion}`, 'success');

    return {
      isSuccess: true,
      updatedApps,
    };
  } catch (error) {
    console.error('Error upgrading app:', error);
    if (error instanceof Error) {
      showErrorWithStatus(error.message, 'Upgrade Error');
    } else {
      showErrorWithStatus('Failed to upgrade application', 'Upgrade Error');
    }
    return { isSuccess: false };
  }
}
