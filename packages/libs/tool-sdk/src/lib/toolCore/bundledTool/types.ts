// src/lib/toolCore/bundledTool/types.ts

import type { VincentTool } from '../../types';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * A VincentTool bundled with metadata and uniquely branded.
 * This ensures only correctly constructed objects are assignable
 * and that literal types for metadata are preserved through inference.
 *
 *
 * @typeParam VT - The Vincent Tool that was bundled for usage
 * @typeParam Metadata - The metadata object containing ipfsCid and packageName
 *
 * @category Interfaces
 */
export type BundledVincentTool<
  VT extends VincentTool<any, any, any, any, any, any, any, any, any, any>,
  Metadata extends {
    readonly ipfsCid: string;
    readonly packageName: string;
  },
  VincentToolApiVersion extends string = string,
> = {
  readonly metadata: Metadata;
  readonly vincentTool: VT;
  /** @hidden */
  readonly vincentToolApiVersion: VincentToolApiVersion;
};
