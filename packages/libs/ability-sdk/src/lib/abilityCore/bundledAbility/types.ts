// src/lib/abilityCore/bundledAbility/types.ts

import type { VincentAbility } from '../../types';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * A VincentAbility bundled with an IPFS CID and uniquely branded.
 * This ensures only correctly constructed objects are assignable.
 *
 *
 * @typeParam VT - The Vincent Ability that was bundled for usage
 * @typeParam IpfsCid - The IPFS CID that the bundled ability was published to
 *
 * @category Interfaces
 */
export type BundledVincentAbility<
  VT extends VincentAbility<any, any, any, any, any, any, any, any, any, any>,
  IpfsCid extends string = string,
  VincentAbilityApiVersion extends string = string,
> = {
  /* @type string */
  readonly ipfsCid: IpfsCid;
  readonly vincentAbility: VT;
  /** @hidden */
  readonly vincentAbilityApiVersion: VincentAbilityApiVersion;
};
