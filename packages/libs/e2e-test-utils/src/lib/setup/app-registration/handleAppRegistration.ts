import { Wallet, providers } from 'ethers';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';

import { type NewAppRegistration, registerNewApp } from './registerNewApp';
import { type NewAppVersionRegistration, registerNewAppVersion } from './registerNewAppVersion';
import type { AppMetadata } from '../types';

export async function handleAppRegistration({
  vincentApiUrl,
  vincentRegistryRpcUrl,
  appManagerPrivateKey,
  appDelegateePrivateKey,
  appMetadata,
  appDelegatees,
  abilityIpfsCids,
  abilityPolicies,
}: {
  vincentApiUrl: string;
  vincentRegistryRpcUrl: string;
  appManagerPrivateKey: `0x${string}`;
  appDelegateePrivateKey: `0x${string}`;
  appMetadata: AppMetadata;
  appDelegatees: `0x${string}`[];
  abilityIpfsCids: string[];
  abilityPolicies: string[][];
}): Promise<NewAppRegistration | NewAppVersionRegistration> {
  console.log('=== Handling app registration ===');

  const delegateeEthersWallet = new Wallet(
    appDelegateePrivateKey,
    new providers.JsonRpcProvider(vincentRegistryRpcUrl),
  );

  const client = getClient({ signer: delegateeEthersWallet });
  const delegateeExistingApp = await client.getAppByDelegateeAddress({
    delegateeAddress: delegateeEthersWallet.address,
  });

  if (delegateeExistingApp) {
    console.log(`Found existing app for delegatee ${delegateeEthersWallet.address}:`);
    console.table({
      'App ID': delegateeExistingApp.id,
      'Latest Version': delegateeExistingApp.latestVersion,
      'Manager Address': delegateeExistingApp.manager,
    });

    return await registerNewAppVersion({
      vincentRegistryRpcUrl,
      vincentApiUrl,
      appManagerPrivateKey,
      existingApp: delegateeExistingApp,
      newAbilityIpfsCids: abilityIpfsCids,
      newAbilityPolicies: abilityPolicies,
    });
  } else {
    return await registerNewApp({
      vincentRegistryRpcUrl,
      vincentApiUrl,
      appMetadata,
      appManagerPrivateKey,
      delegatees: appDelegatees,
      abilityIpfsCids,
      abilityPolicies,
    });
  }
}
