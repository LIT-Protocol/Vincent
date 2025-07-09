// src/lib/toolClient/typeGuards.ts

import type {
  RemoteVincentToolExecutionResult,
  ToolExecuteResponse,
  ToolExecuteResponseFailure,
  ToolExecuteResponseFailureNoResult,
  ToolExecuteResponseSuccess,
  ToolExecuteResponseSuccessNoResult,
} from './execute/types';

/**
 * Runtime type guard for ToolResponse success result.
 */
export function isToolResponseSuccess(
  value: unknown
): value is
  | ToolExecuteResponseSuccess<any, Record<string, any>>
  | ToolExecuteResponseSuccessNoResult<Record<string, any>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as any).success === true
  );
}

/**
 * Runtime type guard for ToolResponse failure result.
 */
export function isToolResponseFailure(
  value: unknown
): value is
  | ToolExecuteResponseFailure<any, Record<string, any>>
  | ToolExecuteResponseFailureNoResult<Record<string, any>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as any).success === false
  );
}

/**
 * General ToolResponse shape check (success or failure).
 */
export function isToolResponse(
  value: unknown
): value is ToolExecuteResponse<any, any, Record<string, any>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as any).success === 'boolean'
  );
}

/**
 * Runtime type guard for RemoteVincentToolExecutionResult.
 * Checks if a value has the shape of a RemoteVincentToolExecutionResult.
 */
export function isRemoteVincentToolExecutionResult(
  value: unknown
): value is RemoteVincentToolExecutionResult<any, any, Record<any, any>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toolExecutionResult' in value &&
    'toolContext' in value &&
    isToolResponse((value as any).toolExecutionResult) &&
    typeof (value as any).toolContext === 'object' &&
    (value as any).toolContext !== null
  );
}
