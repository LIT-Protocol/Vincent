// src/lib/policyCore/bundledPolicy/types.ts

import type { VincentPolicy } from '../../types';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * A VincentPolicy bundled with an IPFS CID
 * This ensures only correctly constructed objects are assignable.
 *
 * @typeParam VP - The Vincent Policy that was bundled for usage
 * @typeParam IpfsCid - The IPFS CID that the bundled tool was published to
 *
 * @category Interfaces
 */
export type BundledVincentPolicy<
  VP extends VincentPolicy<any, any, any, any, any, any, any, any, any, any, any, any, any>,
  IpfsCid extends string = string,
  VincentToolApiVersion extends string = string,
> = {
  /* @type string */
  readonly ipfsCid: IpfsCid;
  readonly vincentPolicy: VP;
  /** @hidden */
  readonly vincentToolApiVersion: VincentToolApiVersion;
};
