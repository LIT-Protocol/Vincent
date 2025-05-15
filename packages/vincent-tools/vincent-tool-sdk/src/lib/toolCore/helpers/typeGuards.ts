// src/lib/toolCore/helpers/typeGuards.ts

import {
  ToolResponseFailure,
  ToolResponseFailureNoResult,
  ToolResponseSuccess,
  ToolResponseSuccessNoResult,
} from '../../types';

export function isToolSuccessResponse(
  value: unknown,
): value is ToolResponseSuccess<unknown> | ToolResponseSuccessNoResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as any).success === true &&
    'result' in value
  );
}

export function isToolFailureResponse(
  value: unknown,
): value is ToolResponseFailure<unknown> | ToolResponseFailureNoResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as any).success === false &&
    'result' in value
  );
}

/**
 * Runtime type guard to check whether a value matches the ToolResponse structure.
 */
export function isToolResponse(
  value: unknown,
): value is ToolResponseFailure<unknown> | ToolResponseFailureNoResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as any).success === 'boolean' &&
    'result' in value
  );
}
