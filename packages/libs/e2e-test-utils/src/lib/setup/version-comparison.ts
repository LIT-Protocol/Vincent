import type { AppVersion } from '@lit-protocol/vincent-contracts-sdk';

/**
 * Compare abilities and policies between two app versions to determine if they're the same.
 * Comparison is order-independent for both abilities and policies.
 *
 * @param existingAppVersion The existing app version fetched from on-chain
 * @param newAbilityIpfsCids Array of ability IPFS CIDs for the new version
 * @param newAbilityPolicies Array of policy IPFS CIDs for each ability (parallel to abilityIpfsCids)
 * @returns true if abilities and policies match, false otherwise
 */
export function areAbilitiesAndPoliciesEqual(
  existingAppVersion: AppVersion,
  newAbilityIpfsCids: string[],
  newAbilityPolicies: string[][],
): boolean {
  // Create a map from ability CID to its policies for easy lookup
  const existingAbilityMap = new Map<string, string[]>();
  existingAppVersion.appVersion.abilities.forEach((ability) => {
    existingAbilityMap.set(ability.abilityIpfsCid, ability.policyIpfsCids);
  });

  // Check if we have the same number of abilities
  if (existingAbilityMap.size !== newAbilityIpfsCids.length) {
    return false;
  }

  // For each ability in the new version, check if it exists with the same policies
  const allMatch = newAbilityIpfsCids.every((abilityId, index) => {
    const existingPolicies = existingAbilityMap.get(abilityId);
    if (existingPolicies === undefined) return false; // Ability doesn't exist in current version

    const newPolicies = newAbilityPolicies[index];
    if (newPolicies === undefined) {
      throw new Error(
        `Parallel arrays are not in sync: abilityPolicies[${index}] is undefined for ability '${abilityId}'.`,
      );
    }

    // Compare policy arrays (order-independent)
    if (existingPolicies.length !== newPolicies.length) return false;

    const sortedExisting = [...existingPolicies].sort();
    const sortedNew = [...newPolicies].sort();

    return sortedExisting.every((policy, i) => policy === sortedNew[i]);
  });

  return allMatch;
}
