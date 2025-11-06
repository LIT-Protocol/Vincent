import { getClient } from '@lit-protocol/vincent-contracts-sdk';

import { getChainHelpers } from '../chain';
import { getAppInfo } from '../delegatee/get-app-info';

/**
 * Registers a new app version. On-chain app versions are immutable, so any time you modify
 * abilities or policies, you must register a new version of your app using the new ipfs CIDs
 *
 * This function will check if the latest app version already has the same abilities and policies.
 * If they match, it will return the existing appVersion without registering a new one.
 *
 * @param abilityIpfsCids - Array of ability IPFS CIDs to register
 * @param abilityPolicies - Array of policy IPFS CIDs for each ability
 * @param registerNewVersionOverride - Whether to register a new version even if the latest version already has the same abilities and policies
 */
export async function registerNewAppVersion({
  abilityIpfsCids,
  abilityPolicies,
  registerNewVersionOverride = false,
}: {
  abilityIpfsCids: string[];
  abilityPolicies: string[][];
  registerNewVersionOverride?: boolean;
}) {
  const app = await getAppInfo();

  if (!app) {
    throw new Error('App was expected, but not found. Please register a new app first.');
  }

  const { appId, appVersion: latestVersion } = app;

  const {
    wallets: { appManager },
  } = await getChainHelpers();

  const client = getClient({ signer: appManager });

  if (!registerNewVersionOverride) {
    // Get the existing app version to compare
    const existingAppVersion = await client.getAppVersion({
      appId,
      version: latestVersion,
    });

    if (existingAppVersion) {
      // Extract existing abilities and policies
      const existingAbilityIpfsCids = existingAppVersion.appVersion.abilities.map(
        (ability) => ability.abilityIpfsCid,
      );
      const existingAbilityPolicies = existingAppVersion.appVersion.abilities.map(
        (ability) => ability.policyIpfsCids,
      );

      // Compare arrays (order matters for abilities and policies)
      const abilitiesMatch =
        existingAbilityIpfsCids.length === abilityIpfsCids.length &&
        existingAbilityIpfsCids.every((cid, index) => cid === abilityIpfsCids[index]);

      const policiesMatch =
        existingAbilityPolicies.length === abilityPolicies.length &&
        existingAbilityPolicies.every((policies, index) => {
          const newPolicies = abilityPolicies[index];
          return (
            policies.length === newPolicies.length &&
            policies.every((policy, policyIndex) => policy === newPolicies[policyIndex])
          );
        });

      if (abilitiesMatch && policiesMatch) {
        console.log(
          `App version ${latestVersion} already has the same abilities and policies. Skipping registration.`,
        );
        return { appId, appVersion: latestVersion };
      }
    }
  }

  // Register new version if abilities or policies have changed
  const { txHash, newAppVersion } = await client.registerNextVersion({
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
