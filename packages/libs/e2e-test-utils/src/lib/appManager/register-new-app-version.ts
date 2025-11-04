import { getClient } from '@lit-protocol/vincent-contracts-sdk';

import { getChainHelpers } from '../chain';
import { getAppInfo } from '../delegatee/get-app-info';

/**
 * Registers a new app version. On-chain app versions are immutable, so any time you modify
 * abilities or policies, you must register a new version of your app using the new ipfs CIDs
 *
 * This function will check if the provided appVersion already has the same abilities and policies.
 * If they match, it will return the existing appVersion without registering a new one.
 *
 * @param abilityIpfsCids - Array of ability IPFS CIDs to register
 * @param abilityPolicies - Array of policy IPFS CIDs for each ability
 * @param appVersion - The app version to compare against (defaults to latestVersion from app info)
 */
export async function registerNewAppVersion({
  abilityIpfsCids,
  abilityPolicies,
  appVersion,
}: {
  abilityIpfsCids: string[];
  abilityPolicies: string[][];
  appVersion?: number;
}) {
  const app = await getAppInfo();

  if (!app) {
    throw new Error('App was expected, but not found. Please register a new app first.');
  }

  const { appId, appVersion: latestVersion } = app;
  const versionToCompare = appVersion ?? latestVersion;

  const {
    wallets: { appManager },
  } = await getChainHelpers();

  const client = getClient({ signer: appManager });

  // Get the existing app version to compare
  const existingAppVersion = await client.getAppVersion({
    appId,
    version: versionToCompare,
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
        `App version ${versionToCompare} already has the same abilities and policies. Skipping registration.`,
      );
      return { appId, appVersion: versionToCompare };
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
