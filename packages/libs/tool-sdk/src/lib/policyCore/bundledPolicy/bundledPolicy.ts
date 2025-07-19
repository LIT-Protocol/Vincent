// src/lib/policyCore/bundledPolicy/bundledPolicy.ts

import type { VincentPolicy } from '../../types';
import type { BundledVincentPolicy } from './types';

import { VINCENT_TOOL_API_VERSION } from '../../constants';

/** @hidden */
export function asBundledVincentPolicy<
  const VP extends VincentPolicy<any, any, any, any, any, any, any, any, any, any, any, any>,
  Metadata extends { readonly packageName: string; readonly ipfsCid: string },
>(vincentPolicy: VP, metadata: Metadata): BundledVincentPolicy<VP, Metadata> {
  const bundledPolicy = {
    metadata,
    vincentPolicy,
  } as BundledVincentPolicy<VP, Metadata>;

  // Add non-enumerable 'magic' property
  Object.defineProperty(bundledPolicy, 'vincentToolApiVersion', {
    value: VINCENT_TOOL_API_VERSION,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  return bundledPolicy as BundledVincentPolicy<VP, Metadata, typeof VINCENT_TOOL_API_VERSION>;
}
