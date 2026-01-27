import { providers, Wallet } from 'ethers';

import { getClient } from '@lit-protocol/vincent-contracts-sdk';

import type { AppMetadata } from '../setupVincentDevEnv';

import { registerApp } from '../vincent-registry-api/registerApp';

export interface NewAppRegistration {
  appId: number;
  appVersion: number;
  accountIndexHash: string;
  txHash: string;
}

export async function registerNewApp({
  vincentRegistryRpcUrl,
  vincentApiUrl,
  appManagerPrivateKey,
  appMetadata,
  delegatees,
  abilityIpfsCids,
  abilityPolicies,
}: {
  vincentRegistryRpcUrl: string;
  vincentApiUrl: string;
  appManagerPrivateKey: `0x${string}`;
  appMetadata: AppMetadata;
  delegatees: string[];
  abilityIpfsCids: string[];
  abilityPolicies: string[][];
}): Promise<NewAppRegistration> {
  console.log('=== Registering new app ===');

  const vincentRegistryEthersProvider = new providers.JsonRpcProvider(vincentRegistryRpcUrl);
  const appManagerEthersWallet = new Wallet(appManagerPrivateKey, vincentRegistryEthersProvider);
  const client = getClient({ signer: appManagerEthersWallet });

  const { txHash, appId, newAppVersion, accountIndexHash } = await client.registerApp({
    delegateeAddresses: delegatees,
    versionAbilities: {
      abilityIpfsCids,
      abilityPolicies,
    },
  });

  console.log('Waiting for 2 block confirmations...');
  await vincentRegistryEthersProvider.waitForTransaction(txHash, 2);
  console.log('App registration transaction confirmed');

  await registerApp({
    vincentApiUrl,
    appManagerPrivateKey,
    appId,
    appMetadata,
  });

  console.table({
    'App ID': appId,
    'App Version': newAppVersion,
    'Account Index Hash': accountIndexHash,
    'App Registration Transaction Hash': txHash,
  });

  console.log('Abilities and Policies:');
  console.table(
    abilityIpfsCids.map((cid: string, index: number) => ({
      'Ability IPFS CID': cid,
      Policies: abilityPolicies[index].join(', '),
    })),
  );

  return {
    appId,
    appVersion: newAppVersion,
    accountIndexHash,
    txHash,
  };
}
