import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { providers, Wallet } from 'ethers';

import { registerAppWithVincentApi } from '../vincent-api/registerAppWithVincentApi';
import type { AppMetadata } from '../types';

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

  await registerAppWithVincentApi({
    vincentApiUrl,
    appManagerPrivateKey,
    appId,
    appMetadata,
  });

  console.table([
    { Name: 'App ID', Value: appId },
    { Name: 'App Version', Value: newAppVersion },
    { Name: 'Account Index Hash', Value: accountIndexHash },
    { Name: 'App Registration Transaction Hash', Value: txHash },
  ]);

  console.log('\nAbilities and Policies:');
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
