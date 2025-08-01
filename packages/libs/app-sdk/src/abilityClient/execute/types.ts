// src/abilityClient/execute/types.ts

import type { z } from 'zod';

import type {
  BaseAbilityContext,
  PolicyEvaluationResultContext,
  SchemaValidationError,
} from '@lit-protocol/vincent-ability-sdk';

/** @category Interfaces */
export interface AbilityExecuteResponseSuccess<Result, Policies extends Record<string, any>> {
  success: true;
  result: Result;
  context?: BaseAbilityContext<PolicyEvaluationResultContext<Policies>>;
}

/** @category Interfaces */
export interface AbilityExecuteResponseSuccessNoResult<Policies extends Record<string, any>> {
  success: true;
  result?: never;
  context?: BaseAbilityContext<PolicyEvaluationResultContext<Policies>>;
}

/** @category Interfaces */
export interface AbilityExecuteResponseFailure<Result, Policies extends Record<string, any>> {
  success: false;
  runtimeError?: string;
  schemaValidationError?: SchemaValidationError;
  result: Result;
  context?: BaseAbilityContext<PolicyEvaluationResultContext<Policies>>;
}

/** @category Interfaces */
export interface AbilityExecuteResponseFailureNoResult<Policies extends Record<string, any>> {
  success: false;
  runtimeError?: string;
  schemaValidationError?: SchemaValidationError;
  result?: never;
  context?: BaseAbilityContext<PolicyEvaluationResultContext<Policies>>;
}

/** @category Interfaces */
export type AbilityExecuteResponse<
  SuccessSchema extends z.ZodType | undefined,
  FailSchema extends z.ZodType | undefined,
  Policies extends Record<string, any>,
> =
  | (SuccessSchema extends z.ZodType
      ? AbilityExecuteResponseSuccess<z.infer<SuccessSchema>, Policies>
      : AbilityExecuteResponseSuccessNoResult<Policies>)
  | (FailSchema extends z.ZodType
      ? AbilityExecuteResponseFailure<z.infer<FailSchema>, Policies>
      : AbilityExecuteResponseFailureNoResult<Policies>);

/** @hidden */
export interface RemoteVincentAbilityExecutionResult<
  SuccessSchema extends z.ZodType | undefined,
  FailSchema extends z.ZodType | undefined,
  Policies extends Record<string, any>,
> {
  abilityExecutionResult: AbilityExecuteResponse<SuccessSchema, FailSchema, Policies>;
  abilityContext: BaseAbilityContext<PolicyEvaluationResultContext<Policies>>;
}
