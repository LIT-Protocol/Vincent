// src/lib/toolCore/toolDef/context/types.ts

import { z } from 'zod';
import {
  BaseContext,
  ToolResultFailure,
  ToolResultFailureNoResult,
  ToolResultSuccess,
  ToolResultSuccessNoResult,
} from '../../../types';

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
  [YouMustCallContextSucceedOrFail]: 'ToolResult';
};

export type EnforceToolResult<T> = typeof YouMustCallContextSucceedOrFail extends keyof T
  ? T
  : {
      ERROR: 'You must return the result of context.succeed() or context.fail()';
      FIX: 'Do not construct tool result objects manually.';
    };

export type ContextSuccess<SuccessResult = never> = SuccessResult extends never
  ? ContextSuccessNoResult
  : MustCallContextSucceedOrFail<ToolResultSuccess<SuccessResult>>;

export type ContextSuccessNoResult = MustCallContextSucceedOrFail<ToolResultSuccessNoResult>;

export type ContextFailure<FailResult = never> = FailResult extends never
  ? ContextFailureNoResult
  : MustCallContextSucceedOrFail<ToolResultFailure<FailResult>>;

export type ContextFailureNoResult = MustCallContextSucceedOrFail<ToolResultFailureNoResult>;

export type ContextResult<SuccessResult, FailResult> =
  | ContextSuccess<SuccessResult>
  | ContextFailure<FailResult>;

export interface ToolContext<
  SuccessSchema extends z.ZodType = z.ZodUndefined,
  FailSchema extends z.ZodType = z.ZodUndefined,
  Policies = any,
> extends BaseToolContext<Policies> {
  succeed: SuccessSchema extends z.ZodUndefined
    ? () => ContextSuccess
    : (result: z.infer<SuccessSchema>) => ContextSuccess<z.infer<SuccessSchema>>;

  fail: FailSchema extends z.ZodUndefined
    ? (error?: string) => ContextFailure
    : (result: z.infer<FailSchema>, error?: string) => ContextFailure<z.infer<FailSchema>>;
}
