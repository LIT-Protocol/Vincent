import type { AppMetadata } from './setupVincentDevEnv';

import { handleAppRegistration } from './app-registration/handeAppRegistration';
import { setActiveVersion } from './vincent-registry-api/setActiveAppVersion';

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
  console.log('=== Setting up Vincent App ===');

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
  // For new apps: handleAppRegistration already called registerAppWithVincentApi
  // For new versions: handleAppRegistration already called registerAppVersionWithVincentApi
  // Now we just need to set the active version
  await setActiveVersion({
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
