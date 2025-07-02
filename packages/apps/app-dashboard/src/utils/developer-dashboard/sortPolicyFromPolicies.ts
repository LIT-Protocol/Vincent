import { Policy } from '@/types/developer-dashboard/appTypes';

export const sortPolicyFromPolicies = (
  policies: Policy[] | undefined,
  packageName: string | undefined,
) => {
  if (!packageName || !policies) return null;
  return policies.find((policy) => policy.packageName === packageName) || null;
};
