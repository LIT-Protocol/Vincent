// src/lib/toolClient/typeGuards.ts

import type {
  RemoteVincentToolExecutionResult,
  ToolExecuteResponse,
  ToolExecuteResponseFailure,
  ToolExecuteResponseFailureNoResult,
  ToolExecuteResponseSuccess,
  ToolExecuteResponseSuccessNoResult,
} from './execute/types';

/** Type guard function that returns true only if the passed value is a successful tool response
 * @category API
 * */
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

/** Type guard function that returns true only if the passed value is a failure tool response
 *  @category API */
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

/** Type guard function that returns true only if the passed value is a failure tool response that was a runtime error
 * This could be caused by code `throw()`ing an error from inside tool or policy code, or by errors encountered in the
 * Vincent SDK wrapping code that handles the execution of the tool/policies.
 *
 * This could also be the result of a schema validation error -- use {@link isToolResponseSchemaValidationFailure} to check
 * to see if have a data validation error.
 *
 *  @category API*/
export function isToolResponseRuntimeFailure(
  value: unknown
): value is ToolExecuteResponseFailureNoResult<Record<string, any>> {
  if (!isToolResponseFailure(value)) return false;

  return 'runtimeError' in value && typeof (value as any).runtimeError === 'string';
}

/** Type guard function that returns true only if the passed value is a failure tool response that was caused by
 * a schema parsing failure.  All data inputs and outputs to / from Vincent Tools and Policies is validated using ZOD schemas.
 *
 * If this returns true, you can parse the `schemaValidationError` property in the response - it is a ZodError object.
 * @category API */
export function isToolResponseSchemaValidationFailure(
  value: unknown
): value is ToolExecuteResponseFailureNoResult<Record<string, any>> {
  if (!isToolResponseFailure(value)) return false;
  return (
    'schemaValidationError' in value && typeof (value as any).schemaValidationError === 'object'
  );
}

/** @hidden */
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

/** @hidden */
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
