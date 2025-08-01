// src/lib/abilityClient/typeGuards.ts

import type {
  RemoteVincentAbilityExecutionResult,
  AbilityExecuteResponse,
  AbilityExecuteResponseFailure,
  AbilityExecuteResponseFailureNoResult,
  AbilityExecuteResponseSuccess,
  AbilityExecuteResponseSuccessNoResult,
} from './execute/types';

/** Type guard function that returns true only if the passed value is a successful ability response
 * @category API
 * */
export function isAbilityResponseSuccess(
  value: unknown
): value is
  | AbilityExecuteResponseSuccess<any, Record<string, any>>
  | AbilityExecuteResponseSuccessNoResult<Record<string, any>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as any).success === true
  );
}

/** Type guard function that returns true only if the passed value is a failure ability response
 *  @category API */
export function isAbilityResponseFailure(
  value: unknown
): value is
  | AbilityExecuteResponseFailure<any, Record<string, any>>
  | AbilityExecuteResponseFailureNoResult<Record<string, any>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as any).success === false
  );
}

/** Type guard function that returns true only if the passed value is a failure ability response that was a runtime error
 * This could be caused by code `throw()`ing an error from inside ability or policy code, or by errors encountered in the
 * Vincent SDK wrapping code that handles the execution of the ability/policies.
 *
 * This could also be the result of a schema validation error -- use {@link isAbilityResponseSchemaValidationFailure} to check
 * to see if have a data validation error.
 *
 *  @category API*/
export function isAbilityResponseRuntimeFailure(
  value: unknown
): value is AbilityExecuteResponseFailureNoResult<Record<string, any>> {
  if (!isAbilityResponseFailure(value)) return false;

  return 'runtimeError' in value && typeof (value as any).runtimeError === 'string';
}

/** Type guard function that returns true only if the passed value is a failure ability response that was caused by
 * a schema parsing failure.  All data inputs and outputs to / from Vincent Abilities and Policies is validated using ZOD schemas.
 *
 * If this returns true, you can parse the `schemaValidationError` property in the response - it is a ZodError object.
 * @category API */
export function isAbilityResponseSchemaValidationFailure(
  value: unknown
): value is AbilityExecuteResponseFailureNoResult<Record<string, any>> {
  if (!isAbilityResponseFailure(value)) return false;
  return (
    'schemaValidationError' in value && typeof (value as any).schemaValidationError === 'object'
  );
}

/** @hidden */
export function isAbilityResponse(
  value: unknown
): value is AbilityExecuteResponse<any, any, Record<string, any>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as any).success === 'boolean'
  );
}

/** @hidden */
export function isRemoteVincentAbilityExecutionResult(
  value: unknown
): value is RemoteVincentAbilityExecutionResult<any, any, Record<any, any>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'abilityExecutionResult' in value &&
    'abilityContext' in value &&
    isAbilityResponse((value as any).abilityExecutionResult) &&
    typeof (value as any).abilityContext === 'object' &&
    (value as any).abilityContext !== null
  );
}
