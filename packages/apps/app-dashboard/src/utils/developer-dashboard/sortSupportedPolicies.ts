import { Policy, ToolVersion } from '@/types/developer-dashboard/appTypes';

export const sortedSupportedPolicies = (allPolicies: Policy[], toolVersionData: ToolVersion) => {
  const supportedPolicyNames = Array.isArray(toolVersionData.supportedPolicies)
    ? toolVersionData.supportedPolicies
    : Object.keys(toolVersionData.supportedPolicies);

  return allPolicies.filter((policy: Policy) =>
    (supportedPolicyNames as string[]).includes(policy.packageName),
  );
};
