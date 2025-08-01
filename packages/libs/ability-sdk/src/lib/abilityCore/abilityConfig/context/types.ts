// src/lib/abilityCore/abilityConfig/context/types.ts

import type { z } from 'zod';

import type {
  BaseContext,
  AbilityResultFailure,
  AbilityResultFailureNoResult,
  AbilityResultSuccess,
  AbilityResultSuccessNoResult,
} from '../../../types';

/** BaseAbilityContext is returned with ability execution results, and contains information about the app, delegation, and
 * policy evaluation results for any policies that the user had enabled for the ability.
 *
 * @category Interfaces
 */
export interface BaseAbilityContext<Policies> extends BaseContext {
  policiesContext: Policies;
}

/**
 * Enforces that ability results (success/failure) must come from context helpers like `context.succeed()` or `context.fail()`.
 */
export const YouMustCallContextSucceedOrFail: unique symbol = Symbol(
  'ExecuteAbilityResult must come from context.succeed() or context.fail()',
);

export type MustCallContextSucceedOrFail<T> = T & {
  [YouMustCallContextSucceedOrFail]: 'AbilityResult';
};

export type EnforceAbilityResult<T> = typeof YouMustCallContextSucceedOrFail extends keyof T
  ? T
  : {
      ERROR: 'You must return the result of context.succeed() or context.fail()';
      FIX: 'Do not construct ability result objects manually.';
    };

export type ContextSuccess<SuccessResult = undefined> = MustCallContextSucceedOrFail<
  AbilityResultSuccess<SuccessResult>
>;

export type ContextSuccessNoResult = MustCallContextSucceedOrFail<AbilityResultSuccessNoResult>;

export type ContextFailure<FailResult = undefined> = MustCallContextSucceedOrFail<
  AbilityResultFailure<FailResult>
>;

export type ContextFailureNoResult = MustCallContextSucceedOrFail<AbilityResultFailureNoResult>;

export type ContextResult<SuccessResult, FailResult> =
  | ContextSuccess<SuccessResult>
  | ContextFailure<FailResult>;

export interface AbilityContext<
  SuccessSchema extends z.ZodType = z.ZodUndefined,
  FailSchema extends z.ZodType = z.ZodUndefined,
  Policies = any,
> extends BaseAbilityContext<Policies> {
  succeed: SuccessSchema extends z.ZodUndefined
    ? () => ContextSuccess
    : (result: z.infer<SuccessSchema>) => ContextSuccess<z.infer<SuccessSchema>>;

  fail: FailSchema extends z.ZodUndefined
    ? () => ContextFailure
    : (result: z.infer<FailSchema>, runtimeError?: string) => ContextFailure<z.infer<FailSchema>>;
}
