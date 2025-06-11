import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { BigNumber } from 'ethers';
import { AppDetails } from '@/types';
import { getUserViewRegistryContract } from './contracts';
import type { AppDefRead } from '@/components/app-dashboard/mock-forms/vincentApiClient';

/**
 * Fetches apps using API data but filtered by on-chain authorized app IDs
 */
export async function fetchUserAppsWithApiCrossReference({
  userPKP,
  sessionSigs,
  agentPKP,
}: {
  userPKP: IRelayPKP | null;
  sessionSigs: SessionSigs | null;
  agentPKP: IRelayPKP | null;
}): Promise<{
  apps: AppDetails[];
  error?: string;
}> {
  // Skip if missing dependencies
  if (!userPKP || !sessionSigs || !agentPKP) {
    return { apps: [], error: 'Missing required authentication. Please reconnect your wallet.' };
  }

  try {
    // Get authorized app IDs from on-chain registry first
    const userViewContract = getUserViewRegistryContract();
    const appIds = await userViewContract.getAllPermittedAppIdsForPkp(agentPKP.tokenId);
    const authorizedAppIds = appIds.map((id: BigNumber) => id.toNumber());

    if (authorizedAppIds.length === 0) {
      return { apps: [] };
    }

    // Then fetch API apps - propagate errors instead of swallowing them
    try {
      const apiUrl = 'https://staging.registry.heyvincent.ai/apps';

      // Add timeout to fail fast instead of waiting for browser default
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(apiUrl, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch apps: ${response.status} ${response.statusText}`);
      }

      const responseText = await response.text();

      let apiApps: AppDefRead[];
      try {
        apiApps = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Failed to parse API response');
      }

      // Filter API apps to only show those the user is authorized for
      const authorizedApiApps = apiApps.filter((apiApp: AppDefRead) => {
        return authorizedAppIds.includes(apiApp.appId);
      });

      // Convert API apps to AppDetails format
      const appDetails: AppDetails[] = authorizedApiApps.map((apiApp: AppDefRead) => {
        return {
          id: apiApp.appId.toString(),
          name: apiApp.name,
          description: apiApp.description,
          deploymentStatus:
            apiApp.deploymentStatus === 'dev' ? 0 : apiApp.deploymentStatus === 'test' ? 1 : 2,
          version: apiApp.activeVersion,
          isDeleted: false,
          // API-specific fields
          logo: apiApp.logo,
          appUserUrl: apiApp.appUserUrl,
          contactEmail: apiApp.contactEmail,
          redirectUris: apiApp.redirectUris,
          managerAddress: apiApp.managerAddress,
          createdAt: apiApp.createdAt,
          updatedAt: apiApp.updatedAt,
        };
      });

      const sortedApps = appDetails.sort((a, b) => {
        if (a.isDeleted !== b.isDeleted) {
          return a.isDeleted ? 1 : -1;
        }
        return a.name.localeCompare(b.name);
      });

      return { apps: sortedApps };
    } catch (apiError) {
      // API error - return error instead of empty array
      let errorMessage: string;
      if (apiError instanceof Error) {
        if (apiError.name === 'AbortError') {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else {
          errorMessage = apiError.message;
        }
      } else {
        errorMessage = String(apiError);
      }
      return {
        apps: [],
        error: errorMessage,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      apps: [],
      error: errorMessage,
    };
  }
}

/**
 * Fetches all permitted applications for a user's PKP (original function, kept for backward compatibility)
 */
export async function fetchUserApps({
  userPKP,
  sessionSigs,
  agentPKP,
}: {
  userPKP: IRelayPKP | null;
  sessionSigs: SessionSigs | null;
  agentPKP: IRelayPKP | null;
}): Promise<{
  apps: AppDetails[];
  error?: string;
}> {
  // Use the new API-focused function by default
  return fetchUserAppsWithApiCrossReference({ userPKP, sessionSigs, agentPKP });
}

/**
 * Fetches all apps from Vincent API for Explorer page
 */
export async function fetchAllApps(): Promise<{
  apps: AppDetails[];
  error?: string;
}> {
  try {
    const apiUrl = 'https://staging.registry.heyvincent.ai/apps';

    // Add timeout to fail fast instead of waiting for browser default
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(apiUrl, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();

    let apiApps: AppDefRead[];
    try {
      apiApps = JSON.parse(responseText);
    } catch (parseError) {
      return { apps: [], error: 'Failed to parse API response' };
    }

    // Convert API apps to AppDetails format
    const appDetails: AppDetails[] = apiApps.map((apiApp: AppDefRead) => {
      return {
        id: apiApp.appId.toString(),
        name: apiApp.name,
        description: apiApp.description,
        deploymentStatus:
          apiApp.deploymentStatus === 'dev' ? 0 : apiApp.deploymentStatus === 'test' ? 1 : 2,
        version: apiApp.activeVersion,
        isDeleted: false,
        // API-specific fields
        logo: apiApp.logo,
        appUserUrl: apiApp.appUserUrl,
        contactEmail: apiApp.contactEmail,
        redirectUris: apiApp.redirectUris,
        managerAddress: apiApp.managerAddress,
        createdAt: apiApp.createdAt,
        updatedAt: apiApp.updatedAt,
      };
    });

    const sortedApps = appDetails.sort((a, b) => {
      if (a.isDeleted !== b.isDeleted) {
        return a.isDeleted ? 1 : -1;
      }
      return a.name.localeCompare(b.name);
    });

    return { apps: sortedApps };
  } catch (error) {
    let errorMessage: string;
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else {
        errorMessage = error.message;
      }
    } else {
      errorMessage = String(error);
    }
    return {
      apps: [],
      error: errorMessage,
    };
  }
}
