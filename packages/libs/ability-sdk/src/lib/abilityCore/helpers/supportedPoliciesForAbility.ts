// src/lib/abilityCore/helpers/supportedPoliciesForAbility.ts

import type { VincentPolicy } from '../../types';

import { assertSupportedAbilityVersion } from '../../assertSupportedAbilityVersion';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type AbilityPolicyMap<T extends readonly any[], PkgNames extends string> = {
  policyByPackageName: {
    [K in PkgNames]: Extract<
      T[number],
      { vincentAbilityApiVersion: string; vincentPolicy: { packageName: K } }
    >;
  };
  policyByIpfsCid: Record<string, T[number]>;
  cidToPackageName: Map<string, PkgNames>;
  packageNameToCid: Map<PkgNames, string>;
};

/**
 * `supportedPoliciesForAbility()` takes an array of bundled Vincent Policies, and provides strong type inference for those policies
 * inside of your VincentAbility's lifecycle functions and return values.
 *
 * ```typescript
 * import { bundledVincentPolicy } from '@lit-protocol/vincent-policy-spending-limit';
 *
 * const SpendingLimitPolicy = createVincentAbilityPolicy({
 *   abilityParamsSchema,
 *   bundledVincentPolicy,
 *   abilityParameterMappings: {
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
 * export const vincentAbility = createVincentAbility({
 *   packageName: '@lit-protocol/vincent-ability-uniswap-swap' as const,
 *   description: 'Uniswap Swap Ability',
 *
 *   abilityParamsSchema,
 *   supportedPolicies: supportedPoliciesForAbility([SpendingLimitPolicy]),
 *
 *   ...
 *
 *   });
 * ```
 *
 * @category API Methods
 */
export function supportedPoliciesForAbility<
  const Policies extends readonly {
    vincentPolicy: VincentPolicy<any, any, any, any, any, any, any, any, any, any, any, any, any>;
    ipfsCid: IpfsCid;
    vincentAbilityApiVersion: VincentAbilityApiVersion;
  }[],
  const IpfsCid extends string = string,
  const VincentAbilityApiVersion extends string = string,
  const PkgNames extends
    Policies[number]['vincentPolicy']['packageName'] = Policies[number]['vincentPolicy']['packageName'],
>(policies: Policies): AbilityPolicyMap<Policies, PkgNames> {
  const policyByPackageName = {} as {
    [K in PkgNames]: Extract<
      Policies[number],
      { vincentAbilityApiVersion: string; vincentPolicy: { packageName: K } }
    >;
  };
  const policyByIpfsCid: Record<string, Policies[number]> = {};
  const cidToPackageName = new Map<string, PkgNames>();
  const packageNameToCid = new Map<PkgNames, string>();

  for (const policy of policies) {
    const { vincentAbilityApiVersion } = policy;
    assertSupportedAbilityVersion(vincentAbilityApiVersion);

    const pkg = policy.vincentPolicy.packageName as PkgNames;
    const cid = policy.ipfsCid;

    if (!pkg) throw new Error('Missing policy packageName');
    if (pkg in policyByPackageName) {
      throw new Error(`Duplicate policy packageName: ${pkg}`);
    }

    policyByPackageName[pkg] = policy as Extract<
      Policies[number],
      { vincentAbilityApiVersion: string; vincentPolicy: { packageName: typeof pkg } }
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
