import { Wallet, providers } from 'ethers';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import type { Chain } from 'viem';

import { registerAppOnChain, getAppByDelegatee, registerNewAppVersion } from './blockchain';
import { registerAppVersion } from './api';
import { areAbilitiesAndPoliciesEqual } from './version-comparison';

export interface AppRegistrationResult {
  appId: number;
  appVersion: number;
  accountIndexHash: string;
  txHash: string;
  isNewApp: boolean;
  needsNewVersion: boolean;
}

/**
 * Handle app registration - either create a new app or update an existing one
 */
export async function handleAppRegistration({
  appManagerWithProvider,
  appDelegateeWithProvider,
  abilityIpfsCids,
  abilityPolicies,
  chain,
  vincentApiUrl,
  appManagerPrivateKey,
  ethersProvider,
}: {
  appManagerWithProvider: Wallet;
  appDelegateeWithProvider: Wallet;
  abilityIpfsCids: string[];
  abilityPolicies: string[][];
  chain: Chain;
  vincentApiUrl: string;
  appManagerPrivateKey: string;
  ethersProvider: providers.JsonRpcProvider;
}): Promise<AppRegistrationResult> {
  // Check if delegatee already belongs to an app
  const existingApp = await getAppByDelegatee(appDelegateeWithProvider);

  if (existingApp) {
    return await handleExistingApp({
      existingApp,
      appManagerWithProvider,
      appDelegateeWithProvider,
      abilityIpfsCids,
      abilityPolicies,
      vincentApiUrl,
      appManagerPrivateKey,
      ethersProvider,
    });
  } else {
    return await handleNewApp({
      appManagerWithProvider,
      appDelegateeWithProvider,
      abilityIpfsCids,
      abilityPolicies,
      chain,
      ethersProvider,
    });
  }
}

/**
 * Handle registration for an existing app
 */
async function handleExistingApp({
  existingApp,
  appManagerWithProvider,
  appDelegateeWithProvider,
  abilityIpfsCids,
  abilityPolicies,
  vincentApiUrl,
  appManagerPrivateKey,
  ethersProvider,
}: {
  existingApp: { appId: number; appVersion: number; managerAddress: string };
  appManagerWithProvider: Wallet;
  appDelegateeWithProvider: Wallet;
  abilityIpfsCids: string[];
  abilityPolicies: string[][];
  vincentApiUrl: string;
  appManagerPrivateKey: string;
  ethersProvider: providers.JsonRpcProvider;
}): Promise<AppRegistrationResult> {
  // Validate that the app is managed by the app manager
  if (existingApp.managerAddress.toLowerCase() !== appManagerWithProvider.address.toLowerCase()) {
    const errorMessage = `❌ Delegatee ${appDelegateeWithProvider.address} already belongs to app ${existingApp.appId} managed by ${existingApp.managerAddress}, but you are trying to register with app manager ${appManagerWithProvider.address}. A delegatee can only belong to one app. Please use a different delegatee address or use the correct app manager.`;
    console.error(`\n${errorMessage}`);
    throw new Error(errorMessage);
  }

  console.log('\n⚠️  Delegatee already belongs to an existing app managed by this app manager.');
  console.log('Checking if abilities/policies have changed...');

  const appId = existingApp.appId;

  // Fetch the accountIndexHash from on-chain app data
  const client = getClient({ signer: appManagerWithProvider });
  const appData = await client.getAppById({ appId: existingApp.appId });
  if (!appData) {
    throw new Error(`Failed to fetch app data for app ID ${existingApp.appId}`);
  }
  const accountIndexHash = appData.accountIndexHash;

  // Check if the latest version already has the same abilities and policies
  const latestVersion = existingApp.appVersion;
  const existingAppVersion = await client.getAppVersion({
    appId: existingApp.appId,
    version: latestVersion,
  });

  // Default: assume we need a new version
  let needsNewVersion = true;
  let appVersion = latestVersion; // Start with latest version, will update if creating new one
  let txHash = ''; // Default to empty hash

  if (existingAppVersion) {
    const abilitiesMatch = areAbilitiesAndPoliciesEqual(
      existingAppVersion,
      abilityIpfsCids,
      abilityPolicies,
    );

    if (abilitiesMatch) {
      console.log(`App version ${latestVersion} already has the same abilities and policies.`);
      console.log('Skipping version registration - reusing existing version.');
      needsNewVersion = false;
    }
  }

  if (needsNewVersion) {
    console.log('Abilities or policies have changed - creating new version.');

    // Step 1: Create pending version in registry API
    // This must be done BEFORE registering on-chain to follow the intended workflow
    console.log('Creating pending version in registry...');
    const apiVersion = await registerAppVersion(
      vincentApiUrl,
      appManagerPrivateKey,
      Number(appId),
      'New version with updated abilities',
    );
    console.log(`Pending version ${apiVersion} created in registry`);

    // Step 2: Register the new version on-chain
    const result = await registerNewAppVersion({
      appManagerWallet: appManagerWithProvider,
      appId: existingApp.appId,
      abilityIpfsCids,
      abilityPolicies,
    });
    appVersion = result.appVersion;
    txHash = result.txHash;

    // Wait for 2 block confirmations before proceeding (if there was a new transaction)
    if (txHash) {
      console.log('⏳ Waiting for 2 block confirmations...');
      await ethersProvider.waitForTransaction(txHash, 2);
      console.log('Transaction confirmed');
    }

    // Verify that on-chain version matches API version
    if (apiVersion !== appVersion) {
      console.warn(
        `⚠️  Version mismatch: API created v${apiVersion} but on-chain is v${appVersion}`,
      );
    }
  }

  return {
    appId,
    appVersion,
    accountIndexHash,
    txHash,
    isNewApp: false,
    needsNewVersion,
  };
}

/**
 * Handle registration for a new app
 */
async function handleNewApp({
  appManagerWithProvider,
  appDelegateeWithProvider,
  abilityIpfsCids,
  abilityPolicies,
  chain,
  ethersProvider,
}: {
  appManagerWithProvider: Wallet;
  appDelegateeWithProvider: Wallet;
  abilityIpfsCids: string[];
  abilityPolicies: string[][];
  chain: Chain;
  ethersProvider: providers.JsonRpcProvider;
}): Promise<AppRegistrationResult> {
  // No existing app, register a new one
  const result = await registerAppOnChain(
    appManagerWithProvider,
    [appDelegateeWithProvider.address],
    abilityIpfsCids,
    abilityPolicies,
    chain,
  );

  const appId = Number(result.appId);
  const accountIndexHash = result.accountIndexHash;
  const appVersion = Number(result.appVersion);
  const txHash = result.hash;

  // Wait for 2 block confirmations before proceeding
  console.log('⏳ Waiting for 2 block confirmations...');
  await ethersProvider.waitForTransaction(txHash, 2);
  console.log('Transaction confirmed');

  return {
    appId,
    appVersion,
    accountIndexHash,
    txHash,
    isNewApp: true,
    needsNewVersion: false,
  };
}
