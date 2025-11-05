import { getClient } from '@lit-protocol/vincent-contracts-sdk';

import { getChainHelpers } from '../chain';
import { getAppInfo } from '../delegatee/get-app-info';

/**
 * Registers a new app version. On-chain app versions are immutable, so any time you modify
 * abilities or policies, you must register a new version of your app using the new ipfs CIDs
 *
 * @param abilityIpfsCids - Array of ability IPFS CIDs to register
 * @param abilityPolicies - Array of policy IPFS CIDs for each ability
 */
export async function registerNewAppVersion({
  abilityIpfsCids,
  abilityPolicies,
}: {
  abilityIpfsCids: string[];
  abilityPolicies: string[][];
}) {
  const app = await getAppInfo();

  if (!app) {
    throw new Error('App was expected, but not found. Please register a new app first.');
  }

  const { appId } = app;

  const {
    wallets: { appManager },
  } = await getChainHelpers();

  const { txHash, newAppVersion } = await getClient({
    signer: appManager,
  }).registerNextVersion({
    appId,
    versionAbilities: {
      abilityIpfsCids: abilityIpfsCids,
      abilityPolicies: abilityPolicies,
    },
  });

  console.log(
    `Registered new App version ${newAppVersion} for existing app: ${appId}\nTx hash: ${txHash}`,
  );

  return { appId, appVersion: newAppVersion };
}
