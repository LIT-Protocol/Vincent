// src/lib/toolCore/helpers/typeGuards.ts

import type {
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
    (value as any).success === true
  );
}

export function isToolFailureResult(
  value: unknown,
): value is ToolResultFailure<unknown> | ToolResultFailureNoResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as any).success === false
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
    typeof (value as any).success === 'boolean'
  );
}
