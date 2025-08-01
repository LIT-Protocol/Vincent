// src/lib/abilityCore/helpers/typeGuards.ts

import type {
  AbilityResultFailure,
  AbilityResultFailureNoResult,
  AbilityResultSuccess,
  AbilityResultSuccessNoResult,
} from '../../types';

export function isAbilitySuccessResult(
  value: unknown,
): value is AbilityResultSuccess<unknown> | AbilityResultSuccessNoResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as any).success === true
  );
}

export function isAbilityFailureResult(
  value: unknown,
): value is AbilityResultFailure<unknown> | AbilityResultFailureNoResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as any).success === false
  );
}

/**
 * Runtime type guard to check whether a value matches the AbilityResult structure.
 */
export function isAbilityResult(
  value: unknown,
): value is AbilityResultFailure<unknown> | AbilityResultFailureNoResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as any).success === 'boolean'
  );
}
