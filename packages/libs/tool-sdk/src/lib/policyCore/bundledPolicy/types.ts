// src/lib/policyCore/bundledPolicy/types.ts

import { VincentPolicy } from '../../types';

export const __bundledPolicyBrand = Symbol('__bundledPolicyBrand');
export type __bundledPolicyBrand = typeof __bundledPolicyBrand;

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * A VincentPolicy bundled with metadata and uniquely branded.
 * This ensures only correctly constructed objects are assignable
 * and that literal types for metadata are preserved through inference.
 *
 * @hidden
 */
export type BundledVincentPolicy<
  VP extends VincentPolicy<any, any, any, any, any, any, any, any, any, any, any, any>,
  Metadata extends {
    readonly ipfsCid: string;
    readonly packageName: string;
  },
> = {
  readonly vincentPolicy: VP;
  readonly metadata: Metadata;
  /** @hidden */
  readonly [__bundledPolicyBrand]: 'BundledVincentPolicy';
};
