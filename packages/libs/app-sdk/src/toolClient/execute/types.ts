// src/toolClient/execute/types.ts

import type { z } from 'zod';

import type {
  BaseToolContext,
  PolicyEvaluationResultContext,
} from '@lit-protocol/vincent-tool-sdk';

/** @category Interfaces */
export interface ToolExecuteResponseSuccess<Result, Policies extends Record<string, any>> {
  success: true;
  result: Result;
  context?: BaseToolContext<PolicyEvaluationResultContext<Policies>>;
}

/** @category Interfaces */
export interface ToolExecuteResponseSuccessNoResult<Policies extends Record<string, any>> {
  success: true;
  result?: never;
  context?: BaseToolContext<PolicyEvaluationResultContext<Policies>>;
}

/** @category Interfaces */
export interface ToolExecuteResponseFailure<Result, Policies extends Record<string, any>> {
  success: false;
  error?: string;
  result: Result;
  context?: BaseToolContext<PolicyEvaluationResultContext<Policies>>;
}

/** @category Interfaces */
export interface ToolExecuteResponseFailureNoResult<Policies extends Record<string, any>> {
  success: false;
  error?: string;
  result?: never;
  context?: BaseToolContext<PolicyEvaluationResultContext<Policies>>;
}

/** @category Interfaces */
export type ToolExecuteResponse<
  SuccessSchema extends z.ZodType | undefined,
  FailSchema extends z.ZodType | undefined,
  Policies extends Record<string, any>,
> =
  | (SuccessSchema extends z.ZodType
      ? ToolExecuteResponseSuccess<z.infer<SuccessSchema>, Policies>
      : ToolExecuteResponseSuccessNoResult<Policies>)
  | (FailSchema extends z.ZodType
      ? ToolExecuteResponseFailure<z.infer<FailSchema>, Policies>
      : ToolExecuteResponseFailureNoResult<Policies>);

export interface RemoteVincentToolExecutionResult<
  SuccessSchema extends z.ZodType | undefined,
  FailSchema extends z.ZodType | undefined,
  Policies extends Record<string, any>,
> {
  toolExecutionResult: ToolExecuteResponse<SuccessSchema, FailSchema, Policies>;
  toolContext: BaseToolContext<PolicyEvaluationResultContext<Policies>>;
}
