import type { z } from 'zod';

import type {
  BaseToolContext,
  PolicyEvaluationResultContext,
} from '@lit-protocol/vincent-tool-sdk'; // or wherever it's defined

export interface ToolResponseSuccess<Result, Policies extends Record<string, any>> {
  success: true;
  result: Result;
  context?: BaseToolContext<PolicyEvaluationResultContext<Policies>>;
}

export interface ToolResponseSuccessNoResult<Policies extends Record<string, any>> {
  success: true;
  result?: never;
  context?: BaseToolContext<PolicyEvaluationResultContext<Policies>>;
}

export interface ToolResponseFailure<Result, Policies extends Record<string, any>> {
  success: false;
  error?: string;
  result: Result;
  context?: BaseToolContext<PolicyEvaluationResultContext<Policies>>;
}

export interface ToolResponseFailureNoResult<Policies extends Record<string, any>> {
  success: false;
  error?: string;
  result?: never;
  context?: BaseToolContext<PolicyEvaluationResultContext<Policies>>;
}

export type ToolResponse<
  SuccessSchema extends z.ZodType | undefined,
  FailSchema extends z.ZodType | undefined,
  Policies extends Record<string, any>,
> =
  | (SuccessSchema extends z.ZodType
      ? ToolResponseSuccess<z.infer<SuccessSchema>, Policies>
      : ToolResponseSuccessNoResult<Policies>)
  | (FailSchema extends z.ZodType
      ? ToolResponseFailure<z.infer<FailSchema>, Policies>
      : ToolResponseFailureNoResult<Policies>);

export interface RemoteVincentToolExecutionResult<
  SuccessSchema extends z.ZodType | undefined,
  FailSchema extends z.ZodType | undefined,
  Policies extends Record<string, any>,
> {
  toolExecutionResult: ToolResponse<SuccessSchema, FailSchema, Policies>;
  toolContext: BaseToolContext<PolicyEvaluationResultContext<Policies>>;
}
