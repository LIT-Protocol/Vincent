import { z } from 'zod';
import { PolicyEvaluationResultContext } from '../types';

export interface ToolResponseSuccess<Result, Policies extends Record<string, any>> {
  success: true;
  result: Result;
  policiesContext?: PolicyEvaluationResultContext<Policies>;
}

export interface ToolResponseSuccessNoResult<Policies extends Record<string, any>> {
  success: true;
  result?: never;
  policiesContext?: PolicyEvaluationResultContext<Policies>;
}

export interface ToolResponseFailure<Result, Policies extends Record<string, any>> {
  success: false;
  error?: string;
  result: Result;
  policiesContext?: PolicyEvaluationResultContext<Policies>;
}

export interface ToolResponseFailureNoResult<Policies extends Record<string, any>> {
  success: false;
  error?: string;
  result?: never;
  policiesContext?: PolicyEvaluationResultContext<Policies>;
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
