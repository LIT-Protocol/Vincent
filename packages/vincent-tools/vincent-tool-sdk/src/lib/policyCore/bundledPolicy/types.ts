// src/lib/policyCore/bundledPolicy/types.ts

import { VincentPolicy } from '../../types';

export const __bundledPolicyBrand = Symbol('__bundledPolicyBrand');
export type __bundledPolicyBrand = typeof __bundledPolicyBrand;

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * A VincentPolicy bundled with an IPFS CID and uniquely branded.
 * This ensures only correctly constructed objects are assignable.
 */
export type BundledVincentPolicy<
  VP extends VincentPolicy<any, any, any, any, any, any, any, any, any, any, any, any, any>,
  IpfsCid extends string = string,
> = {
  readonly ipfsCid: IpfsCid;
  readonly vincentPolicy: VP;
  readonly [__bundledPolicyBrand]: 'BundledVincentPolicy';
};
