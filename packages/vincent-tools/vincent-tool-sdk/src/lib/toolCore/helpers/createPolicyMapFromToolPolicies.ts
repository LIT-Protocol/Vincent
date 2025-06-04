// src/lib/toolCore/helpers/createPolicyMapFromToolPolicies.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

export type ToolPolicyMap<T extends readonly any[], PkgNames extends string> = {
  policyByPackageName: {
    [K in PkgNames]: Extract<T[number], { vincentPolicy: { packageName: K } }>;
  };
  policyByIpfsCid: Record<string, T[number]>;
  cidToPackageName: Map<string, PkgNames>;
  packageNameToCid: Map<PkgNames, string>;
};

/**
 * Safely builds a strongly typed policy map from an array of VincentToolPolicy entries.
 * Enforces literal string `packageName` keys and exposes reverse lookup maps.
 */
export function createPolicyMapFromToolPolicies<
  const Policies extends readonly {
    vincentPolicy: { packageName: string };
    ipfsCid: string;
  }[],
  const PkgNames extends
    Policies[number]['vincentPolicy']['packageName'] = Policies[number]['vincentPolicy']['packageName'],
>(policies: Policies): ToolPolicyMap<Policies, PkgNames> {
  const policyByPackageName = {} as {
    [K in PkgNames]: Extract<Policies[number], { vincentPolicy: { packageName: K } }>;
  };
  const policyByIpfsCid: Record<string, Policies[number]> = {};
  const cidToPackageName = new Map<string, PkgNames>();
  const packageNameToCid = new Map<PkgNames, string>();

  for (const policy of policies) {
    const pkg = policy.vincentPolicy.packageName as PkgNames;
    const cid = policy.ipfsCid;

    if (!pkg) throw new Error('Missing policy packageName');
    if (pkg in policyByPackageName) {
      throw new Error(`Duplicate policy packageName: ${pkg}`);
    }

    policyByPackageName[pkg] = policy as Extract<
      Policies[number],
      { vincentPolicy: { packageName: typeof pkg } }
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
