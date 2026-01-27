import { providers, Wallet } from 'ethers';

import { getClient } from '@lit-protocol/vincent-contracts-sdk';

export async function registerNewAppVersionOnChain({
  vincentRegistryRpcUrl,
  appManagerPrivateKey,
  appId,
  abilityIpfsCids,
  abilityPolicies,
}: {
  vincentRegistryRpcUrl: string;
  appManagerPrivateKey: `0x${string}`;
  appId: number;
  abilityIpfsCids: string[];
  abilityPolicies: string[][];
}): Promise<{ appId: number; appVersion: number; txHash: string }> {
  const vincentRegistryEthersProvider = new providers.JsonRpcProvider(vincentRegistryRpcUrl);
  const appManagerEthersWallet = new Wallet(appManagerPrivateKey, vincentRegistryEthersProvider);
  const client = getClient({ signer: appManagerEthersWallet });

  // Register new version if abilities or policies have changed
  const { txHash, newAppVersion } = await client.registerNextVersion({
    appId,
    versionAbilities: {
      abilityIpfsCids,
      abilityPolicies,
    },
  });

  console.log('Waiting for 2 block confirmations...');
  await vincentRegistryEthersProvider.waitForTransaction(txHash, 2);
  console.log('New app version registration transaction confirmed');

  return { appId, appVersion: newAppVersion, txHash };
}
