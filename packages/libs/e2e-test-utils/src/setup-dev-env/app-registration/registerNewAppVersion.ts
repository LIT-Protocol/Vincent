import { getClient, type App, deriveSmartAccountIndex } from '@lit-protocol/vincent-contracts-sdk';
import { providers, Wallet } from 'ethers';
import { toHex } from 'viem';

import { areAbilitiesAndPoliciesEqual } from './areAbilitiesAndPoliciesEqual';
import { registerAppVersionWithVincentApi } from '../vincent-api/registerAppVersionWithVincentApi';
import { registerNewAppVersionOnChain } from '../blockchain/registerNewAppVersionOnChain';

export interface NewAppVersionRegistration {
  appId: number;
  appVersion: number;
  accountIndexHash: string;
  txHash?: string;
}

export async function registerNewAppVersion({
  vincentRegistryRpcUrl,
  vincentApiUrl,
  existingApp,
  appManagerPrivateKey,
  newAbilityIpfsCids,
  newAbilityPolicies,
}: {
  vincentRegistryRpcUrl: string;
  vincentApiUrl: string;
  existingApp: App;
  appManagerPrivateKey: `0x${string}`;
  newAbilityIpfsCids: string[];
  newAbilityPolicies: string[][];
}): Promise<NewAppVersionRegistration> {
  console.log('=== Registering new app version ===');

  const vincentRegistryEthersProvider = new providers.JsonRpcProvider(vincentRegistryRpcUrl);
  const appManagerEthersWallet = new Wallet(appManagerPrivateKey, vincentRegistryEthersProvider);
  const client = getClient({ signer: appManagerEthersWallet });

  if (existingApp.manager.toLowerCase() !== appManagerEthersWallet.address.toLowerCase()) {
    throw new Error(
      `${existingApp.manager} is the manager of app ${existingApp.id}, not the provided app manager: ${appManagerEthersWallet.address}.`,
    );
  }

  const latestAppVersion = await client.getAppVersion({
    appId: existingApp.id,
    version: existingApp.latestVersion,
  });

  if (!latestAppVersion) {
    throw new Error(
      `Latest app version: ${existingApp.latestVersion} for app ${existingApp.id} not found.`,
    );
  }

  const abilitiesMatch = areAbilitiesAndPoliciesEqual(
    latestAppVersion.appVersion,
    newAbilityIpfsCids,
    newAbilityPolicies,
  );

  if (!abilitiesMatch) {
    const { newAppVersion: newAppVersionFromVincentApi } = await registerAppVersionWithVincentApi({
      vincentApiUrl,
      appManagerPrivateKey,
      appId: existingApp.id,
      whatChanged: `New version with updated abilities (${new Date().toISOString()})`,
    });

    const {
      appId,
      appVersion: newAppVersionFromChain,
      txHash,
    } = await registerNewAppVersionOnChain({
      vincentRegistryRpcUrl,
      appManagerPrivateKey,
      appId: existingApp.id,
      abilityIpfsCids: newAbilityIpfsCids,
      abilityPolicies: newAbilityPolicies,
    });

    if (newAppVersionFromVincentApi !== newAppVersionFromChain) {
      throw new Error(
        `New app version from Vincent API: ${newAppVersionFromVincentApi} does not match new app version from chain: ${newAppVersionFromChain}`,
      );
    }

    const accountIndexHash = toHex(deriveSmartAccountIndex(appId), { size: 32 });

    console.log('New app version registered');
    console.table({
      'App ID': appId,
      'New App Version': newAppVersionFromChain,
      'Account Index Hash': accountIndexHash,
      'Version Registration Transaction Hash': txHash,
    });

    return {
      appId,
      appVersion: newAppVersionFromChain,
      accountIndexHash,
      txHash,
    };
  } else {
    console.log('Abilities and Policies match, no new app version needed');
  }

  const accountIndexHash = toHex(deriveSmartAccountIndex(existingApp.id), { size: 32 });

  return {
    appId: existingApp.id,
    appVersion: existingApp.latestVersion,
    accountIndexHash,
  };
}
