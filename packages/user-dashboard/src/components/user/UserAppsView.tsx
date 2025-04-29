import { useEffect, useState, useCallback } from 'react';
import { SessionSigs, IRelayPKP } from '@lit-protocol/types';
import { useErrorPopup } from '@/providers/ErrorPopup';
import * as ethers from 'ethers';
import { LIT_RPC } from '@lit-protocol/constants';
import USER_VIEW_FACET_ABI from '@/services/contract/abis/VincentUserViewFacet.abi.json';
import APP_VIEW_FACET_ABI from '@/services/contract/abis/VincentAppViewFacet.abi.json';
import { env } from '@/config/env';
import { BigNumber } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import { upgradeAppToLatestVersion } from '@/utils/upgradeUtils';
import { useVersionEnabledCheck } from '@/components/consent/hooks/useVersionEnabledCheck';

interface UserAppsViewProps {
  userPKP: IRelayPKP;
  sessionSigs: SessionSigs;
  agentPKP?: IRelayPKP;
}

// Define the app type based on actual contract data
interface AppDetails {
  id: string;
  name: string;
  description?: string;
  deploymentStatus: number;
  managementWallet: string;
  version?: number;
  isDeleted: boolean;
  latestVersion?: string;
  delegatees: string[];
  authorizedRedirectUris: string[];
  showUpgradePrompt?: boolean;
}

// Create a separate AppCard component that can use hooks
interface AppCardProps {
  app: AppDetails;
  onUpgrade: (appId: string) => void;
  onClick: (appId: string) => void;
  isUpgrading: boolean;
  upgradingAppId: string | null;
}

function AppCard({ app, onClick }: AppCardProps) {
  const { isVersionEnabled } = useVersionEnabledCheck({
    versionNumber: Number(app.version),
    specificAppId: app.id,
  });

  const { isVersionEnabled: isLatestVersionEnabled } = useVersionEnabledCheck({
    versionNumber: Number(app.latestVersion),
    specificAppId: app.id,
  });

  const getVersionStatusText = () => {
    if (!app.version || !app.latestVersion) return null;

    if (isVersionEnabled === false && isLatestVersionEnabled === false) {
      return `Both your current version (${app.version}) and the latest version have been disabled by the app developer.`;
    } else if (isLatestVersionEnabled === false) {
      return `The latest version is currently disabled by the developer.`;
    } else if (isVersionEnabled === false) {
      return `Version ${app.version} has been disabled by the app developer. Please update to the latest version.`;
    }

    if (app.showUpgradePrompt) {
      return `Version ${app.latestVersion} is available (you're using v${app.version}).`;
    }

    return null;
  };

  const versionStatusText = getVersionStatusText();

  return (
    <div
      onClick={() => onClick(app.id)}
      className="bg-white rounded-xl border shadow-sm p-6 cursor-pointer transition-all hover:shadow-md"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold">{app.name}</h3>
        <div className="flex items-center gap-2">
          {versionStatusText && (
            <div className="relative group">
              <Info className="h-4 w-4 text-amber-500" />
              <div className="absolute right-0 z-10 invisible group-hover:visible bg-white p-2 rounded shadow-lg border border-gray-200 w-64 text-xs text-gray-700 mt-1">
                {versionStatusText}
              </div>
            </div>
          )}
          {app.version && (
            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
              v{app.version}
            </span>
          )}
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 h-10 line-clamp-2">
        {app.description || 'No description provided'}
      </p>

      <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-100">
        <div className="flex items-center">
          <span className="text-xs font-medium mr-1">Status:</span>
          <span
            className={`px-2 py-0.5 text-xs rounded-full ${
              app.deploymentStatus === 0
                ? 'bg-amber-100 text-amber-800'
                : app.deploymentStatus === 1
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
            }`}
          >
            {app.deploymentStatus === 0 ? 'DEV' : app.deploymentStatus === 1 ? 'TEST' : 'PROD'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function UserAppsView({ userPKP, sessionSigs, agentPKP }: UserAppsViewProps) {
  const [apps, setApps] = useState<AppDetails[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'warning' | 'success' | 'error'>('info');
  const [isUpgrading, setIsUpgrading] = useState<boolean>(false);
  const [upgradingAppId, setUpgradingAppId] = useState<string | null>(null);

  const navigate = useNavigate();
  const { showError } = useErrorPopup();

  // Status message handling - use useCallback to prevent recreation on every render
  const showStatus = useCallback(
    (message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
      setStatusMessage(message);
      setStatusType(type);

      // Clear success/info messages after a delay
      if (type === 'success' || type === 'info') {
        setTimeout(() => {
          setStatusMessage('');
        }, 5000);
      }
    },
    [],
  );

  // Show both popup and status error - use useCallback
  const showErrorWithStatus = useCallback(
    (errorMessage: string, title?: string, details?: string) => {
      showError(errorMessage, title || 'Error', details);
      showStatus(errorMessage, 'error');
    },
    [showError, showStatus],
  );

  // Convert BigNumber to string/number - no need for state/props, no need for useCallback
  const convertBigNumber = (value: any): any => {
    if (typeof value === 'object' && value && value._isBigNumber) {
      return value.toString();
    }
    return value;
  };

  // Fetch all permitted applications for the user's PKP
  useEffect(() => {
    // Flag to prevent state updates if component unmounts
    let isMounted = true;

    // Skip if missing dependencies
    if (!userPKP || !sessionSigs || !agentPKP) {
      showErrorWithStatus(
        'Missing required authentication. Please reconnect your wallet.',
        'error',
      );
      if (isMounted) {
        setIsLoading(false);
      }
      return;
    }

    async function fetchUserApps() {
      setIsLoading(true);

      try {
        // Get contract address from env
        const contractAddress = env.VITE_VINCENT_DATIL_CONTRACT;

        // Set up provider
        const provider = new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE);

        // Create contract instances
        const userViewContract = new ethers.Contract(
          contractAddress,
          USER_VIEW_FACET_ABI,
          provider,
        );

        const appViewContract = new ethers.Contract(contractAddress, APP_VIEW_FACET_ABI, provider);

        // We've already checked that agentPKP is defined in the guard clause at the top of useEffect
        // TypeScript just doesn't know that, so we need to use a non-null assertion
        const tokenId = agentPKP!.tokenId;

        // Get all permitted app IDs for the agent PKP
        console.log('Fetching apps for agent address:', tokenId);
        const appIds = await userViewContract.getAllPermittedAppIdsForPkp(tokenId);
        console.log('appIds', appIds);

        if (!isMounted) return;

        if (!appIds || appIds.length === 0) {
          setApps([]);
          showStatus("You haven't authorized any applications yet", 'info');
          setIsLoading(false);
          return;
        }

        const appDetailsPromises = appIds.map(async (appId: BigNumber) => {
          try {
            // Get app ID as a number for using in other API calls
            const appIdNumber = appId.toNumber();

            // Get the app info using the app ID
            const appInfo = await appViewContract.getAppById(appIdNumber);

            // Get the permitted version for this PKP and app - agentPKP is defined here
            const permittedVersion = await userViewContract.getPermittedAppVersionForPkp(
              tokenId,
              appIdNumber,
            );

            // Convert version values to numbers for comparison
            const currentVersion = permittedVersion
              ? typeof permittedVersion === 'object' && permittedVersion._isBigNumber
                ? parseInt(permittedVersion.toString())
                : permittedVersion
              : null;

            const latestVersionValue = appInfo.latestVersion
              ? typeof appInfo.latestVersion === 'object' && appInfo.latestVersion._isBigNumber
                ? parseInt(appInfo.latestVersion.toString())
                : appInfo.latestVersion
              : null;

            // Check if upgrade is available
            const showUpgradePrompt =
              currentVersion !== null &&
              latestVersionValue !== null &&
              currentVersion < latestVersionValue;

            return {
              id: appIdNumber.toString(),
              name: convertBigNumber(appInfo.name) || 'Unnamed App',
              description: convertBigNumber(appInfo.description) || '',
              // Ensure deploymentStatus is a number
              deploymentStatus:
                typeof appInfo.deploymentStatus === 'object' &&
                appInfo.deploymentStatus._isBigNumber
                  ? parseInt(appInfo.deploymentStatus.toString())
                  : appInfo.deploymentStatus,
              managementWallet: convertBigNumber(appInfo.manager) || '', // Using manager field instead of managementWallet
              version: currentVersion,
              isDeleted: appInfo.isDeleted,
              latestVersion: latestVersionValue,
              delegatees: appInfo.delegatees,
              authorizedRedirectUris: appInfo.authorizedRedirectUris,
              showUpgradePrompt,
            };
          } catch (err) {
            console.warn(`Error fetching details for app ${appId}:`, err);
            // If we get here, we still need to handle BigNumber properly
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

        if (!isMounted) return;

        // Sort apps: active apps first (non-deleted), then by name
        const sortedApps = appDetails.sort((a, b) => {
          // First sort by deleted status
          if (a.isDeleted !== b.isDeleted) {
            return a.isDeleted ? 1 : -1;
          }

          // Then sort alphabetically by name
          return a.name.localeCompare(b.name);
        });

        setApps(sortedApps);
      } catch (error) {
        console.error('Error fetching user apps:', error);
        if (error instanceof Error) {
          showErrorWithStatus(error.message, 'Application Error');
        } else {
          showErrorWithStatus('Failed to load applications', 'Application Error');
        }
        if (isMounted) {
          setApps([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchUserApps();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [userPKP, sessionSigs, agentPKP, showErrorWithStatus, showStatus]);

  // Handler for app upgrade
  const handleAppUpgrade = useCallback(
    async (appId: string) => {
      if (!userPKP || !agentPKP || !sessionSigs) {
        showErrorWithStatus('Missing required authentication data');
        return;
      }

      setIsUpgrading(true);
      setUpgradingAppId(appId);

      try {
        // Get the app details to find current and latest versions
        const appToUpgrade = apps.find((app) => app.id === appId);

        if (!appToUpgrade) {
          throw new Error('App not found');
        }

        const currentVersion =
          appToUpgrade.version !== undefined ? Number(appToUpgrade.version) : null;

        const latestVersion =
          appToUpgrade.latestVersion !== undefined ? Number(appToUpgrade.latestVersion) : null;

        if (currentVersion === null || latestVersion === null) {
          throw new Error('Missing version information');
        }

        await upgradeAppToLatestVersion({
          appId,
          agentPKP,
          userPKP,
          sessionSigs,
          currentVersion,
          latestVersion,
          onStatusChange: showStatus,
          onError: showErrorWithStatus,
        });

        // Update the app in the state
        setApps((prevApps) =>
          prevApps.map((app) => {
            if (app.id === appId) {
              return {
                ...app,
                version: Number(app.latestVersion),
                showUpgradePrompt: false,
              };
            }
            return app;
          }),
        );

        showStatus(`Successfully upgraded ${appToUpgrade.name} to v${latestVersion}`, 'success');
      } catch (error) {
        console.error('Error upgrading app:', error);
        if (error instanceof Error) {
          showErrorWithStatus(error.message, 'Upgrade Error');
        } else {
          showErrorWithStatus('Failed to upgrade application', 'Upgrade Error');
        }
      } finally {
        setIsUpgrading(false);
        setUpgradingAppId(null);
      }
    },
    [userPKP, agentPKP, sessionSigs, apps, showErrorWithStatus, showStatus],
  );

  // Handler for card click
  const handleCardClick = (appId: string) => {
    navigate(`/appId/${appId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-sm text-gray-600">Loading your applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Applications</h1>
      </div>

      {statusMessage && (
        <div
          className={`p-4 mb-6 rounded-lg border ${
            statusType === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : statusType === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          {statusMessage}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-gray-800 rounded-full"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              onUpgrade={handleAppUpgrade}
              onClick={handleCardClick}
              isUpgrading={isUpgrading}
              upgradingAppId={upgradingAppId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
