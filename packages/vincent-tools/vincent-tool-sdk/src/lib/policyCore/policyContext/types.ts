// src/lib/policyContext/types.ts
import { z } from 'zod';
import {
  PolicyResponseAllow,
  PolicyResponseAllowNoResult,
  PolicyResponseDeny,
  PolicyResponseDenyNoResult,
} from '../../types';

export const YouMustCallContextAllowOrDeny: unique symbol = Symbol(
  'PolicyResponses must come from calling context.allow() or context.deny()',
);
export type MustCallContextAllowOrDeny<T> = T & {
  [YouMustCallContextAllowOrDeny]: 'PolicyResponse';
};
export type ContextAllowResponse<AllowResult> = MustCallContextAllowOrDeny<
  PolicyResponseAllow<AllowResult>
>;
export type ContextAllowResponseNoResult = MustCallContextAllowOrDeny<PolicyResponseAllowNoResult>;
export type ContextDenyResponse<DenyResult> = MustCallContextAllowOrDeny<
  PolicyResponseDeny<DenyResult>
>;
export type ContextDenyResponseNoResult = MustCallContextAllowOrDeny<PolicyResponseDenyNoResult>;

export interface PolicyContext<
  AllowSchema extends z.ZodType | undefined = undefined,
  DenySchema extends z.ZodType | undefined = undefined,
> {
  delegation: {
    delegatee: string;
    delegator: string;
  };

  // Instead of branded types, we use conditional types directly
  allow: AllowSchema extends z.ZodType
    ? (result: z.infer<AllowSchema>) => ContextAllowResponse<z.infer<AllowSchema>>
    : () => ContextAllowResponseNoResult;

  deny: DenySchema extends z.ZodType
    ? (result: z.infer<DenySchema>, error?: string) => ContextDenyResponse<z.infer<DenySchema>>
    : (error?: string) => ContextDenyResponseNoResult;
}

export type EnforcePolicyResponse<T> = typeof YouMustCallContextAllowOrDeny extends keyof T
  ? T
  : {
      ERROR: 'You must return the result of context.allow() or context.deny()';
      FIX: 'Do not construct the return value manually. Use the injected context helpers.';
    };
