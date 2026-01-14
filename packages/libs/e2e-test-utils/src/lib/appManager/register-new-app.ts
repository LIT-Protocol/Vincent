import { getClient } from '@lit-protocol/vincent-contracts-sdk';

import { getChainHelpers } from '../chain';

/**
 * Registers a new app
 * @param abilityIpfsCids - Array of ability IPFS CIDs to register
 * @param abilityPolicies - Array of policy IPFS CIDs for each ability
 */
export async function registerNewApp({
  abilityIpfsCids,
  abilityPolicies,
}: {
  abilityIpfsCids: string[];
  abilityPolicies: string[][];
}) {
  const {
    wallets: { appManager, appDelegatee },
  } = await getChainHelpers();

  const { txHash, appId } = await getClient({
    signer: appManager,
  }).registerApp({
    delegateeAddresses: [await appDelegatee.getAddress()],
    versionAbilities: {
      abilityIpfsCids: abilityIpfsCids,
      abilityPolicies: abilityPolicies,
    },
  });

  console.log(`Registered new App with ID: ${appId}\nTx hash: ${txHash}`);

  return { appId: appId, appVersion: 1 };
}
