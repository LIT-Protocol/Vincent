// src/lib/policyCore/bundledPolicy/bundledPolicy.ts

import { __bundledPolicyBrand, BundledVincentPolicy } from './types';
import { VincentPolicy } from '../../types';

/** @hidden */
export function asBundledVincentPolicy<
  const VP extends VincentPolicy<any, any, any, any, any, any, any, any, any, any, any, any>,
  Metadata extends { readonly packageName: string; readonly ipfsCid: string },
>(vincentPolicy: VP, metadata: Metadata): BundledVincentPolicy<VP, Metadata> {
  return {
    metadata,
    vincentPolicy,
    [__bundledPolicyBrand]: 'BundledVincentPolicy',
  };
}
