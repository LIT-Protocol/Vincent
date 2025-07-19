// src/lib/policyCore/bundledPolicy/types.ts

import type { VincentPolicy } from '../../types';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * A VincentPolicy bundled with metadata and uniquely branded.
 * This ensures only correctly constructed objects are assignable
 * and that literal types for metadata are preserved through inference.
 *
 * @typeParam VP - The Vincent Policy that was bundled for usage
 * @typeParam Metadata - The metadata object containing ipfsCid and packageName
 *
 * @category Interfaces
 */
export type BundledVincentPolicy<
  VP extends VincentPolicy<any, any, any, any, any, any, any, any, any, any, any, any>,
  Metadata extends {
    readonly ipfsCid: string;
    readonly packageName: string;
  },
  VincentToolApiVersion extends string = string,
> = {
  readonly metadata: Metadata;
  readonly vincentPolicy: VP;
  /** @hidden */
  readonly vincentToolApiVersion: VincentToolApiVersion;
};
