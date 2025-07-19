// src/lib/toolCore/helpers/supportedPoliciesForTool.ts

import type { VincentPolicy } from '../../types';

import { assertSupportedToolVersion } from '../../assertSupportedToolVersion';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type ToolPolicyMap<T extends readonly any[], PkgNames extends string> = {
  policyByPackageName: {
    [K in PkgNames]: Extract<T[number], { metadata: { packageName: K } }>;
  };
  policyByIpfsCid: Record<string, T[number]>;
  cidToPackageName: Map<string, PkgNames>;
  packageNameToCid: Map<PkgNames, string>;
};

/**
 * `supportedPoliciesForTool()` takes an array of bundled Vincent Policies, and provides strong type inference for those policies
 * inside of your VincentTool's lifecycle functions and return values.
 *
 * ```typescript
 * import { bundledVincentPolicy } from '@lit-protocol/vincent-policy-spending-limit';
 *
 * const SpendingLimitPolicy = createVincentToolPolicy({
 *   toolParamsSchema,
 *   bundledVincentPolicy,
 *   toolParameterMappings: {
 *     rpcUrlForUniswap: 'rpcUrlForUniswap',
 *     chainIdForUniswap: 'chainIdForUniswap',
 *     ethRpcUrl: 'ethRpcUrl',
 *     tokenInAddress: 'tokenAddress',
 *     tokenInDecimals: 'tokenDecimals',
 *     tokenInAmount: 'buyAmount',
 *   },
 * });
 *
 *
 * export const vincentTool = createVincentTool({
 *   packageName: '@lit-protocol/vincent-tool-uniswap-swap' as const,
 *   description: 'Uniswap Swap Tool',
 *
 *   toolParamsSchema,
 *   supportedPolicies: supportedPoliciesForTool([SpendingLimitPolicy]),
 *
 *   ...
 *
 *   });
 * ```
 *
 * @category API Methods
 */
export function supportedPoliciesForTool<
  const Policies extends readonly {
    readonly vincentPolicy: VincentPolicy<
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any
    >;
    readonly metadata: {
      readonly ipfsCid: string;
      readonly packageName: string;
    };
    readonly vincentToolApiVersion: string;
  }[],
  const PkgNames extends
    Policies[number]['metadata']['packageName'] = Policies[number]['metadata']['packageName'],
>(policies: Policies): ToolPolicyMap<Policies, PkgNames> {
  const policyByPackageName = {} as {
    [K in PkgNames]: Extract<Policies[number], { metadata: { packageName: K } }>;
  };
  const policyByIpfsCid: Record<string, Policies[number]> = {};
  const cidToPackageName = new Map<string, PkgNames>();
  const packageNameToCid = new Map<PkgNames, string>();

  for (const policy of policies) {
    const { vincentToolApiVersion } = policy;
    assertSupportedToolVersion(vincentToolApiVersion);

    const pkg = policy.metadata.packageName as PkgNames;
    const cid = policy.metadata.ipfsCid;

    if (!pkg) throw new Error('Missing policy packageName');
    if (pkg in policyByPackageName) {
      throw new Error(`Duplicate policy packageName: ${pkg}`);
    }

    policyByPackageName[pkg] = policy as Extract<
      Policies[number],
      { metadata: { packageName: typeof pkg } }
    >;
    policyByIpfsCid[cid] = policy;
    cidToPackageName.set(cid, pkg);
    packageNameToCid.set(pkg, cid);
  }

  return {
    policyByPackageName,
    policyByIpfsCid,
    cidToPackageName,
    packageNameToCid,
  };
}
