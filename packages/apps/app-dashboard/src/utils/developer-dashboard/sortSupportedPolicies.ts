import { Policy, AbilityVersion } from '@/types/developer-dashboard/appTypes';

export const sortedSupportedPolicies = (
  allPolicies: Policy[],
  abilityVersionData: AbilityVersion,
) => {
  if (!abilityVersionData.supportedPolicies) {
    return [];
  }

  const supportedPolicyNames = Array.isArray(abilityVersionData.supportedPolicies)
    ? abilityVersionData.supportedPolicies
    : Object.keys(abilityVersionData.supportedPolicies);

  return allPolicies.filter((policy: Policy) =>
    (supportedPolicyNames as string[]).includes(policy.packageName),
  );
};
