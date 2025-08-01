// src/lib/policyCore/bundledPolicy/bundledPolicy.ts

import type { VincentPolicy } from '../../types';
import type { BundledVincentPolicy } from './types';

import { VINCENT_TOOL_API_VERSION } from '../../constants';

/** @hidden */
export function asBundledVincentPolicy<
  const VP extends VincentPolicy<any, any, any, any, any, any, any, any, any, any, any, any, any>,
  const IpfsCid extends string,
>(vincentPolicy: VP, ipfsCid: IpfsCid): BundledVincentPolicy<VP, IpfsCid> {
  const bundledPolicy = {
    ipfsCid,
    vincentPolicy,
  } as BundledVincentPolicy<VP, IpfsCid>;

  // Add non-enumerable 'magic' property
  Object.defineProperty(bundledPolicy, 'vincentAbilityApiVersion', {
    value: VINCENT_TOOL_API_VERSION,
    writable: false,
    enumerable: true,
    configurable: false,
  });

  return bundledPolicy as BundledVincentPolicy<VP, IpfsCid, typeof VINCENT_TOOL_API_VERSION>;
}
