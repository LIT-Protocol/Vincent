// src/lib/toolCore/toolContext/types.ts

import { z } from 'zod';
import {
  BaseContext,
  ToolResponseFailure,
  ToolResponseFailureNoResult,
  ToolResponseSuccess,
  ToolResponseSuccessNoResult,
} from '../../types';

export interface BaseToolContext<Policies> extends BaseContext {
  policiesContext: Policies;
}

/**
 * Enforces that tool results (success/failure) must come from context helpers like `context.succeed()` or `context.fail()`.
 */
export const YouMustCallContextSucceedOrFail: unique symbol = Symbol(
  'ExecuteToolResult must come from context.succeed() or context.fail()',
);

export type MustCallContextSucceedOrFail<T> = T & {
  [YouMustCallContextSucceedOrFail]: 'ToolResponse';
};

export type EnforceToolResponse<T> = typeof YouMustCallContextSucceedOrFail extends keyof T
  ? T
  : {
      ERROR: 'You must return the result of context.succeed() or context.fail()';
      FIX: 'Do not construct tool result objects manually.';
    };

export type ContextSuccess<SuccessResult = never> = SuccessResult extends never
  ? ContextSuccessNoResult
  : MustCallContextSucceedOrFail<ToolResponseSuccess<SuccessResult>>;

export type ContextSuccessNoResult = MustCallContextSucceedOrFail<ToolResponseSuccessNoResult>;

export type ContextFailure<FailResult = never> = FailResult extends never
  ? ContextFailureNoResult
  : MustCallContextSucceedOrFail<ToolResponseFailure<FailResult>>;

export type ContextFailureNoResult = MustCallContextSucceedOrFail<ToolResponseFailureNoResult>;

export interface ToolContext<
  SuccessSchema extends z.ZodType | undefined = undefined,
  FailSchema extends z.ZodType | undefined = undefined,
  Policies = any,
> extends BaseToolContext<Policies> {
  succeed: SuccessSchema extends z.ZodType
    ? (result: z.infer<SuccessSchema>) => ContextSuccess<z.infer<SuccessSchema>>
    : () => ContextSuccess;

  fail: FailSchema extends z.ZodType
    ? (result: z.infer<FailSchema>, error?: string) => ContextFailure<z.infer<FailSchema>>
    : (error?: string) => ContextFailure;
}
