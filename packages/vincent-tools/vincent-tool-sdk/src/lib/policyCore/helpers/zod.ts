// src/lib/policyCore/helpers/zod.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { z, ZodType } from 'zod';
import {
  PolicyResponseDeny,
  PolicyResponseDenyNoResult,
  VincentPolicyDef,
  ZodValidationDenyResult,
} from '../../types';
import { createDenyResult } from './resultCreators';
import { isPolicyDenyResponse } from './typeGuards';

/**
 * Matches the minimum structure of a PolicyResponse.
 * This is useful when validating that a response shape is at least plausible.
 */
export const PolicyResponseShape = z.object({
  allow: z.boolean(),
  ipfsCid: z.string(),
  result: z.unknown(),
});

const mustBeUndefinedSchema = z.undefined();

/**
 * Validates a value using a Zod schema (or requires undefined if none given).
 * Returns parsed result or a standardized deny object.
 *
 * @param value - The raw value to validate
 * @param schema - A Zod schema to apply, or undefined (meaning: must be undefined)
 * @param ipfsCid - The policy's IPFS identifier
 * @param phase - One of 'evaluate' | 'precheck' | 'commit'
 * @param stage - 'parameters' (before calling the lifecycle phase) or 'result' (after receiving the result)
 *
 * @returns The parsed result, or a PolicyResponseDeny with a ZodValidationDenyResult
 */
export function validateOrDeny<T extends ZodType<any, any, any>>(
  value: unknown,
  schema: T,
  ipfsCid: string,
  phase: 'evaluate' | 'precheck' | 'commit',
  stage: 'input' | 'output',
): T | PolicyResponseDeny<ZodValidationDenyResult> | PolicyResponseDenyNoResult {
  const effectiveSchema = schema ?? mustBeUndefinedSchema;
  const parsed = effectiveSchema.safeParse(value);

  if (!parsed.success) {
    const descriptor = stage === 'input' ? 'parameters' : 'result';
    const message = `Invalid ${phase} ${descriptor}.`;
    return createDenyResult<ZodValidationDenyResult>({
      ipfsCid,
      message,
      result: { zodError: parsed.error },
    });
  }

  return parsed.data;
}

type InferToolParams<
  TPolicy extends VincentPolicyDef<any, any, any, any, any, any, any, any, any, any, any, any, any>,
> = z.infer<TPolicy['toolParamsSchema']>;
type InferUserParams<
  TPolicy extends VincentPolicyDef<any, any, any, any, any, any, any, any, any, any, any, any, any>,
> =
  TPolicy['userParamsSchema'] extends z.ZodType<any, any, any>
    ? z.infer<TPolicy['userParamsSchema']>
    : undefined;
type ParamResult<
  TPolicy extends VincentPolicyDef<any, any, any, any, any, any, any, any, any, any, any, any, any>,
> =
  | {
      toolParams: InferToolParams<TPolicy>;
      userParams: InferUserParams<TPolicy>;
    }
  | PolicyResponseDeny<ZodValidationDenyResult>
  | PolicyResponseDenyNoResult;

interface ValidatedParamsOrDeny<
  TPolicy extends VincentPolicyDef<any, any, any, any, any, any, any, any, any, any, any, any, any>,
> {
  policyDef: TPolicy;
  rawToolParams: unknown;
  rawUserParams: unknown;
  ipfsCid: string;
  phase: 'evaluate' | 'precheck' | 'commit';
}

export function getValidatedParamsOrDeny<
  TPolicy extends VincentPolicyDef<any, any, any, any, any, any, any, any, any, any, any, any, any>,
>({
  policyDef,
  rawToolParams,
  rawUserParams,
  ipfsCid,
  phase,
}: ValidatedParamsOrDeny<TPolicy>): ParamResult<TPolicy> {
  const toolParams = validateOrDeny(
    rawToolParams,
    policyDef.toolParamsSchema,
    ipfsCid,
    phase,
    'input',
  );
  if (isPolicyDenyResponse(toolParams))
    return toolParams as PolicyResponseDeny<ZodValidationDenyResult>;

  const userParams = validateOrDeny(
    rawUserParams,
    policyDef.userParamsSchema,
    ipfsCid,
    phase,
    'input',
  );
  if (isPolicyDenyResponse(userParams))
    return userParams as PolicyResponseDeny<ZodValidationDenyResult>;

  return {
    toolParams,
    userParams,
  };
}
