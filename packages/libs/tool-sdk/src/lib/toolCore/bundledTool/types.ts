// src/lib/toolCore/bundledTool/types.ts

import type { VincentTool } from '../../types';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * A VincentTool bundled with an IPFS CID and uniquely branded.
 * This ensures only correctly constructed objects are assignable.
 *
 *
 * @typeParam VT - The Vincent Tool that was bundled for usage
 * @typeParam IpfsCid - The IPFS CID that the bundled tool was published to
 *
 * @category Interfaces
 */
export type BundledVincentTool<
  VT extends VincentTool<any, any, any, any, any, any, any, any, any, any>,
  IpfsCid extends string = string,
  VincentToolApiVersion extends string = string,
> = {
  /* @type string */
  readonly ipfsCid: IpfsCid;
  readonly vincentTool: VT;
  /** @hidden */
  readonly vincentToolApiVersion: VincentToolApiVersion;
};
