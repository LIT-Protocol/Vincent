// src/lib/toolClient/typeGuards.ts

import {
  ToolResponse,
  ToolResponseFailure,
  ToolResponseFailureNoResult,
  ToolResponseSuccess,
  ToolResponseSuccessNoResult,
} from './types';

/**
 * Runtime type guard for ToolResponse success result.
 */
export function isToolResponseSuccess(
  value: unknown,
): value is
  | ToolResponseSuccess<any, Record<string, any>>
  | ToolResponseSuccessNoResult<Record<string, any>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as any).success === true &&
    'result' in value
  );
}

/**
 * Runtime type guard for ToolResponse failure result.
 */
export function isToolResponseFailure(
  value: unknown,
): value is
  | ToolResponseFailure<any, Record<string, any>>
  | ToolResponseFailureNoResult<Record<string, any>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as any).success === false &&
    'result' in value
  );
}

/**
 * General ToolResponse shape check (success or failure).
 */
export function isToolResponse(
  value: unknown,
): value is ToolResponse<any, any, Record<string, any>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as any).success === 'boolean' &&
    'result' in value
  );
}
