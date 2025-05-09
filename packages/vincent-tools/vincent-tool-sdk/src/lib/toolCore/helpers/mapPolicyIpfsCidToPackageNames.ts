// src/lib/toolCore/helpers/mapPolicyIpfsCidToPackageNames.ts

import { TypeOf, z } from 'zod';

import { VincentPolicyDef } from '../../types';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Create a reverse mapping of Policy IPFS CIDs to Policy package names
// to avoid having to loop over toolDef.supportedPolicies for each
// registered on-chain policy
export const mapPolicyIpfsCidToPackageNames = <
  ToolParams extends z.ZodType<any, any, any>,
  Policies extends Record<
    string,
    {
      policyDef: VincentPolicyDef<any, any, any, any, any, any, any, any, any, any, any, any, any>;
      toolParameterMappings: Partial<{ [K in keyof TypeOf<ToolParams>]: string }>;
    }
  >,
>({
  policies,
}: {
  policies: Policies;
}) => {
  return Object.entries(policies).reduce(
    (acc, [key, policy]) => {
      acc[policy.policyDef.ipfsCid] = key as keyof Policies;
      return acc;
    },
    {} as Record<string, keyof Policies>,
  );
};
