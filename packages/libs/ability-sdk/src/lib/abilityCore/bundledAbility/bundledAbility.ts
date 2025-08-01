// src/lib/abilityCore/bundledAbility/bundledAbility.ts

import type { VincentAbility } from '../../types';
import type { BundledVincentAbility } from './types';

import { VINCENT_TOOL_API_VERSION } from '../../constants';

/** @hidden */
export function asBundledVincentAbility<
  const VT extends VincentAbility<any, any, any, any, any, any, any, any, any, any>,
  const IpfsCid extends string,
>(vincentAbility: VT, ipfsCid: IpfsCid): BundledVincentAbility<VT, IpfsCid> {
  const bundledAbility = {
    ipfsCid,
    vincentAbility,
  } as BundledVincentAbility<VT, IpfsCid>;

  // Add non-enumerable 'magic' property
  Object.defineProperty(bundledAbility, 'vincentAbilityApiVersion', {
    value: VINCENT_TOOL_API_VERSION,
    writable: false,
    enumerable: true,
    configurable: false,
  });

  return bundledAbility as BundledVincentAbility<VT, IpfsCid, typeof VINCENT_TOOL_API_VERSION>;
}
