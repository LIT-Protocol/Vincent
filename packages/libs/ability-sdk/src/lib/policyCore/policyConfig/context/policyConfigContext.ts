// src/lib/policyConfig/context/policyConfigContext.ts

import type { BaseContext } from '../../../types';
import type { PolicyContext } from './types';

import { createAllow, createDeny } from './resultCreators';

/**
 * Creates a policy execution context to be passed into lifecycle methods
 * like `evaluate`, `precheck`, and `commit`. This context includes strongly
 * typed `allow()` and `deny()` helpers based on optional Zod schemas, and is used
 * internally by VincentPolicyConfig wrappers to standardize response structure.
 */
export function createPolicyContext({
  baseContext,
}: {
  baseContext: BaseContext;
}): PolicyContext<any, any> {
  // Select the appropriate function implementation based on schema presence
  return {
    ...baseContext,
    allow: createAllow as PolicyContext<any, any>['allow'],
    deny: createDeny as PolicyContext<any, any>['deny'],
  };
}
