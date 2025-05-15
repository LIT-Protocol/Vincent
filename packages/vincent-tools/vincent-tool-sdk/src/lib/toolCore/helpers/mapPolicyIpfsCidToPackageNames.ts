// src/lib/toolCore/helpers/mapPolicyIpfsCidToPackageNames.ts

import { z } from 'zod';

import { VincentPolicyDef, VincentToolDef, VincentToolPolicy } from '../../types';
import { createVincentTool, EnrichedVincentToolPolicy } from '../vincentTool';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Create a reverse mapping of Policy IPFS CIDs to Policy package names
// to avoid having to loop over toolDef.supportedPolicies for each
// registered on-chain policy
export function mapPolicyIpfsCidToPackageNames<
  PolicyArray extends readonly VincentToolPolicy<
    z.ZodType,
    VincentPolicyDef<any, any, any, any, any, any, any, any, any, any, any, any, any>
  >[],
  PolicyMapType extends Record<string, EnrichedVincentToolPolicy> = {
    [K in PolicyArray[number]['policyDef']['packageName']]: Extract<
      PolicyArray[number],
      { policyDef: { packageName: K } }
    >;
  },
>({
  vincentToolDef,
}: {
  vincentToolDef: VincentToolDef<
    z.ZodType,
    PolicyArray,
    PolicyArray[number]['policyDef']['packageName'],
    PolicyMapType,
    any,
    any,
    any,
    any,
    any,
    any
  >;
}): Record<PolicyMapType[keyof PolicyMapType]['policyDef']['ipfsCid'], keyof PolicyMapType> {
  const vincentTool = createVincentTool(vincentToolDef);
  return Object.entries(vincentTool.supportedPolicies).reduce(
    (acc, [key, policy]) => {
      const ipfsCid = policy.policyDef
        .ipfsCid as PolicyMapType[keyof PolicyMapType]['policyDef']['ipfsCid'];
      acc[ipfsCid] = key;
      return acc;
    },
    {} as Record<PolicyMapType[keyof PolicyMapType]['policyDef']['ipfsCid'], keyof PolicyMapType>,
  );
}
