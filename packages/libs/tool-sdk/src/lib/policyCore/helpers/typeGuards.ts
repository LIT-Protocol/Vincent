// src/lib/policyCore/helpers/typeGuards.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { z } from 'zod';

import type {
  PolicyResponse,
  PolicyResponseAllow,
  PolicyResponseDeny,
  ZodValidationDenyResult,
} from '../../types';

export function isZodValidationDenyResult(result: unknown): result is ZodValidationDenyResult {
  return typeof result === 'object' && result !== null && 'zodError' in result;
}

export function isPolicyDenyResponse<T>(val: unknown): val is PolicyResponseDeny<T> {
  return typeof val === 'object' && val !== null && (val as any).allow === false;
}

export function isPolicyAllowResponse<T>(val: unknown): val is PolicyResponseAllow<T> {
  return typeof val === 'object' && val !== null && (val as any).allow === true;
}

export function isPolicyResponse<AllowResult extends z.ZodType, DenyResult extends z.ZodType>(
  value: unknown,
): value is PolicyResponse<AllowResult, DenyResult> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'allow' in value &&
    typeof (value as any).allow === 'boolean'
  );
}
