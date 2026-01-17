import { handleAppRegistration } from './app-registration/handleAppRegistration';
import { setActiveVersionWithVincentApi } from './vincent-api/setActiveVersionWithVincentApi';
import type { AppMetadata } from './types';

export interface SetupVincentAppParams {
  vincentApiUrl: string;
  vincentRegistryRpcUrl: string;
  appMetadata: AppMetadata;
  appManagerPrivateKey: `0x${string}`;
  appDelegateePrivateKey: `0x${string}`;
  appDelegatees: `0x${string}`[];
  abilityIpfsCids: string[];
  abilityPolicies: string[][];
}

export interface VincentAppInfo {
  appId: number;
  appVersion: number;
  accountIndexHash?: string;
  txHash?: string;
}

/**
 * Setup Vincent app registration and API configuration.
 *
 * This handles:
 * - App registration on-chain (new app or new version)
 * - Registering app with Vincent API backend (new apps only)
 * - Setting active version in API
 *
 * @param params App setup parameters
 * @returns App information including ID, version, and registration details
 */
export async function setupVincentApp({
  vincentApiUrl,
  vincentRegistryRpcUrl,
  appMetadata,
  appManagerPrivateKey,
  appDelegateePrivateKey,
  appDelegatees,
  abilityIpfsCids,
  abilityPolicies,
}: SetupVincentAppParams): Promise<VincentAppInfo> {
  console.log('\n=== Setting up Vincent App ===');

  // Step 1: Handle app registration (new app or new version)
  // This registers on-chain and with the API
  const registration = await handleAppRegistration({
    vincentApiUrl,
    vincentRegistryRpcUrl,
    appManagerPrivateKey,
    appDelegateePrivateKey,
    appMetadata,
    appDelegatees,
    abilityIpfsCids,
    abilityPolicies,
  });

  // Step 2: Set active version
  // For new apps: registerNewApp already called registerAppWithVincentApi
  // For new versions: registerNewAppVersion already called registerAppVersionWithVincentApi
  // Now we just need to set the active version
  await setActiveVersionWithVincentApi({
    vincentApiUrl,
    appManagerPrivateKey,
    appId: registration.appId,
    activeVersion: registration.appVersion,
  });

  return {
    appId: registration.appId,
    appVersion: registration.appVersion,
    accountIndexHash:
      'accountIndexHash' in registration ? registration.accountIndexHash : undefined,
    txHash: registration.txHash,
  };
}
