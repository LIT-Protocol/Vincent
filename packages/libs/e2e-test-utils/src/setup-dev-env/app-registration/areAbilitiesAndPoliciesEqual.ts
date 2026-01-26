import type { AppVersion } from '@lit-protocol/vincent-contracts-sdk';

export function areAbilitiesAndPoliciesEqual(
  existingAppVersion: AppVersion,
  newAbilityIpfsCids: string[],
  newAbilityPolicies: string[][],
): boolean {
  // Create a map from ability CID to its policies for easy lookup
  const existingAbilityMap = new Map<string, string[]>();
  existingAppVersion.abilities.forEach((ability) => {
    existingAbilityMap.set(ability.abilityIpfsCid, ability.policyIpfsCids as string[]);
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
