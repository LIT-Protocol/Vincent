// src/lib/policyCore/helpers/typeGuards.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  PolicyResponse,
  PolicyResponseAllow,
  PolicyResponseDeny,
  ZodValidationDenyResult,
} from '../../types';

export function isZodValidationDenyResult(result: unknown): result is ZodValidationDenyResult {
  return typeof result === 'object' && result !== null && 'zodError' in result;
}

export function isPolicyDenyResponse<T>(val: unknown): val is PolicyResponseDeny<T> {
  return (
    typeof val === 'object' &&
    val !== null &&
    (val as any).allow === false &&
    typeof (val as any).ipfsCid === 'string'
  );
}

export function isPolicyAllowResponse<T>(val: unknown): val is PolicyResponseAllow<T> {
  return (
    typeof val === 'object' &&
    val !== null &&
    (val as any).allow === true &&
    typeof (val as any).ipfsCid === 'string'
  );
}

export function isPolicyResponse<AllowResult, DenyResult>(
  value: unknown,
): value is PolicyResponse<AllowResult, DenyResult> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'allow' in value &&
    typeof (value as any).allow === 'boolean' &&
    'ipfsCid' in value &&
    typeof (value as any).ipfsCid === 'string'
  );
}
