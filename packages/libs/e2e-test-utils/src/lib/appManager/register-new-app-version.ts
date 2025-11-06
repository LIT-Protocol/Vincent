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
 * @param abilityPolicies - Array of policy IPFS CIDs for each ability (must be parallel to abilityIpfsCids)
 * @param registerNewVersionOverride - Whether to register a new version even if the latest version already has the same abilities and policies
 *
 * @remarks
 * Assumptions:
 * - `abilityIpfsCids` and `abilityPolicies` are parallel arrays where `abilityPolicies[i]` contains
 *   the policy CIDs for the ability at `abilityIpfsCids[i]`
 * - The comparison is order-independent for both abilities and policies within each ability
 * - Two app versions are considered equivalent if they have the same set of abilities (regardless of order)
 *   and each ability has the same set of policies (regardless of order)
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
      // Create a map from ability CID to its policies for easy lookup
      const existingAbilityMap = new Map<string, string[]>();
      existingAppVersion.appVersion.abilities.forEach((ability) => {
        existingAbilityMap.set(ability.abilityIpfsCid, ability.policyIpfsCids);
      });

      // Check if we have the same number of abilities
      if (existingAbilityMap.size !== abilityIpfsCids.length) {
        // Different number of abilities, need to register new version; fall through to register new version
      } else {
        // For each ability in the new version, check if it exists with the same policies
        const allMatch = abilityIpfsCids.every((abilityId, index) => {
          const existingPolicies = existingAbilityMap.get(abilityId);
          if (!existingPolicies) return false; // Ability doesn't exist in current version

          const newPolicies = abilityPolicies[index];
          if (!newPolicies) return false; // Handle undefined policies

          // Compare policy arrays (order-independent)
          if (existingPolicies.length !== newPolicies.length) return false;

          const sortedExisting = [...existingPolicies].sort();
          const sortedNew = [...newPolicies].sort();

          return sortedExisting.every((policy, i) => policy === sortedNew[i]);
        });

        if (allMatch) {
          console.log(
            `App version ${latestVersion} already has the same abilities and policies. Skipping registration.`,
          );
          return { appId, appVersion: latestVersion };
        }
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
