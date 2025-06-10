// src/lib/toolCore/helpers/typeGuards.ts

import {
  ToolResultFailure,
  ToolResultFailureNoResult,
  ToolResultSuccess,
  ToolResultSuccessNoResult,
} from '../../types';

export function isToolSuccessResult(
  value: unknown,
): value is ToolResultSuccess<unknown> | ToolResultSuccessNoResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as any).success === true &&
    'result' in value
  );
}

export function isToolFailureResult(
  value: unknown,
): value is ToolResultFailure<unknown> | ToolResultFailureNoResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as any).success === false &&
    'result' in value
  );
}

/**
 * Runtime type guard to check whether a value matches the ToolResult structure.
 */
export function isToolResult(
  value: unknown,
): value is ToolResultFailure<unknown> | ToolResultFailureNoResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as any).success === 'boolean' &&
    'result' in value
  );
}
