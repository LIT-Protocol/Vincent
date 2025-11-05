import { getClient } from '@lit-protocol/vincent-contracts-sdk';

import { getChainHelpers } from '../chain';

function generateRandomAppId(): number {
  return Math.floor(Math.random() * (100_000_000_000 - 10_000_000_000)) + 10_000_000_000;
}

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

  const appId = generateRandomAppId();

  const { txHash } = await getClient({
    signer: appManager,
  }).registerApp({
    appId,
    delegateeAddresses: [await appDelegatee.getAddress()],
    versionAbilities: {
      abilityIpfsCids: abilityIpfsCids,
      abilityPolicies: abilityPolicies,
    },
  });

  console.log(`Registered new App with ID: ${appId}\nTx hash: ${txHash}`);

  return { appId, appVersion: 1 };
}
