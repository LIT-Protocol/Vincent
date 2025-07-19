// src/lib/policyConfig/context/types.ts

import type { z } from 'zod';

import type {
  PolicyResponseAllow,
  PolicyResponseAllowNoResult,
  PolicyResponseDeny,
  PolicyResponseDenyNoResult,
  BaseContext,
} from '../../../types';

const YouMustCallContextAllowOrDeny: unique symbol = Symbol(
  'PolicyResponses must come from calling context.allow() or context.deny()',
);

type MustCallContextAllowOrDeny<T> = T & {
  [YouMustCallContextAllowOrDeny]: 'PolicyResponse';
};

export type EnforcePolicyResponse<T> = typeof YouMustCallContextAllowOrDeny extends keyof T
  ? T
  : {
      ERROR: 'You must return the result of context.allow() or context.deny()';
      FIX: 'Do not construct the return value manually. Use the injected context helpers.';
    };

export type ContextAllowResponse<AllowResult> = MustCallContextAllowOrDeny<
  PolicyResponseAllow<AllowResult>
>;
export type ContextAllowResponseNoResult = MustCallContextAllowOrDeny<PolicyResponseAllowNoResult>;
export type ContextDenyResponse<DenyResult> = MustCallContextAllowOrDeny<
  PolicyResponseDeny<DenyResult>
>;
export type ContextDenyResponseNoResult = MustCallContextAllowOrDeny<PolicyResponseDenyNoResult>;

/**
 * @expand
 * @category Interfaces
 * */
export interface PolicyContext<
  AllowSchema extends z.ZodType = z.ZodUndefined,
  DenySchema extends z.ZodType = z.ZodUndefined,
> extends BaseContext {
  allow: AllowSchema extends z.ZodUndefined
    ? () => ContextAllowResponseNoResult
    : (result: z.infer<AllowSchema>) => ContextAllowResponse<z.infer<AllowSchema>>;

  deny: DenySchema extends z.ZodUndefined
    ? (error?: string) => ContextDenyResponseNoResult
    : (result: z.infer<DenySchema>, error?: string) => ContextDenyResponse<z.infer<DenySchema>>;
}
