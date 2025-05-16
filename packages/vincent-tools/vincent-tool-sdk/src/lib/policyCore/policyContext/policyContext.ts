// src/lib/policyContext/policyContext.ts
import { z } from 'zod';
import { BaseContext } from '../../types';
import {
  ContextAllowResponse,
  ContextAllowResponseNoResult,
  ContextDenyResponse,
  ContextDenyResponseNoResult,
  PolicyContext,
} from './types';

interface CreatePolicyContextParams<
  AllowSchema extends z.ZodType | undefined = undefined,
  DenySchema extends z.ZodType | undefined = undefined,
> {
  allowSchema?: AllowSchema;
  denySchema?: DenySchema;
  baseContext: BaseContext;
}

/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Creates a policy execution context to be passed into lifecycle methods
 * like `evaluate`, `precheck`, and `commit`. This context includes strongly
 * typed `allow()` and `deny()` helpers based on optional Zod schemas, and is used
 * internally by VincentPolicyDef wrappers to standardize response structure.
 */
export function createPolicyContext<
  AllowSchema extends z.ZodType | undefined = undefined,
  DenySchema extends z.ZodType | undefined = undefined,
>({
  baseContext,
  allowSchema,
  denySchema,
}: CreatePolicyContextParams<AllowSchema, DenySchema>): PolicyContext<AllowSchema, DenySchema> {
  function allowWithSchema<T>(result: T): ContextAllowResponse<T> {
    return {
      allow: true,
      result,
    } as ContextAllowResponse<T>;
  }

  function allowWithoutSchema(): ContextAllowResponseNoResult {
    return {
      allow: true,
    } as ContextAllowResponseNoResult;
  }

  function denyWithSchema<T>(result: T, error?: string): ContextDenyResponse<T> {
    return {
      allow: false,
      result,
    } as ContextDenyResponse<T>;
  }

  function denyWithoutSchema(error?: string): ContextDenyResponseNoResult {
    return {
      allow: false,
      ...(error ? { error } : {}),
      result: undefined as never,
    } as ContextDenyResponseNoResult;
  }

  // Select the appropriate function implementation based on schema presence
  const allow = allowSchema ? allowWithSchema : allowWithoutSchema;
  const deny = denySchema ? denyWithSchema : denyWithoutSchema;

  return {
    delegation: baseContext.delegation,
    allow: allow as AllowSchema extends z.ZodType
      ? (result: z.infer<AllowSchema>) => ContextAllowResponse<z.infer<AllowSchema>>
      : () => ContextAllowResponseNoResult,
    deny: deny as DenySchema extends z.ZodType
      ? (result: z.infer<DenySchema>, error?: string) => ContextDenyResponse<z.infer<DenySchema>>
      : (error?: string) => ContextDenyResponseNoResult,
  };
}
