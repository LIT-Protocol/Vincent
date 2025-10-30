import { Policy, AbilityVersion } from '@/types/developer-dashboard/appTypes';

export interface PolicyWithVersion extends Policy {
  specificVersion?: string;
}

export const sortedSupportedPolicies = (
  allPolicies: Policy[],
  abilityVersionData: AbilityVersion,
): PolicyWithVersion[] => {
  if (!abilityVersionData.supportedPolicies) {
    return [];
  }

  const supportedPolicyNames = Array.isArray(abilityVersionData.supportedPolicies)
    ? abilityVersionData.supportedPolicies
    : Object.keys(abilityVersionData.supportedPolicies);

  return allPolicies
    .filter((policy: Policy) => (supportedPolicyNames as string[]).includes(policy.packageName))
    .map((policy: Policy) => {
      // If supportedPolicies is a Record<string, string>, get the specific version
      const specificVersion =
        !Array.isArray(abilityVersionData.supportedPolicies) && abilityVersionData.supportedPolicies
          ? abilityVersionData.supportedPolicies[policy.packageName]
          : undefined;

      return {
        ...policy,
        specificVersion,
      };
    });
};
