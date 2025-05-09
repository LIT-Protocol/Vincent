// src/lib/policyCore/evaluate.ts

import { PolicyResponse, VincentPolicyDef } from '../types';
import {
  createDenyResult,
  getSchemaForPolicyResponseResult,
  getValidatedParamsOrDeny,
  isPolicyDenyResponse,
  validateOrDeny,
} from './helpers';
import { createVincentPolicy } from './vincentPolicy';
import { z } from 'zod';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Executes the `evaluate` method on a wrapped VincentToolPolicy, with runtime validation
 * on input and output using the Zod schemas defined by the policy.
 */
export async function evaluate<
  UserParamsSchema extends z.ZodType<any, any, any> = VincentPolicyDef<
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  >['userParamsSchema'],
  EvalDenyResult extends z.ZodType<any, any, any> | undefined = VincentPolicyDef<
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  >['evalDenyResultSchema'],
  EvalAllowResult extends z.ZodType<any, any, any> | undefined = VincentPolicyDef<
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  >['evalAllowResultSchema'],
>(
  policyDef: VincentPolicyDef<
    any,
    any,
    UserParamsSchema,
    any,
    any,
    EvalAllowResult,
    EvalDenyResult,
    any,
    any,
    any,
    any,
    any,
    any
  >,
  args: {
    toolParams: unknown;
    userParams: unknown;
    delegation: { delegatee: string; delegator: string };
  },
): Promise<PolicyResponse<EvalAllowResult, EvalDenyResult>> {
  const { toolParams, userParams, delegation } = args;
  const { ipfsCid } = policyDef;

  try {
    const validated = getValidatedParamsOrDeny({
      policyDef,
      rawToolParams: toolParams,
      rawUserParams: userParams,
      ipfsCid,
      phase: 'evaluate',
    });

    if (isPolicyDenyResponse(validated)) {
      return validated as PolicyResponse<EvalAllowResult, EvalDenyResult>;
    }

    const vincentPolicy = createVincentPolicy(policyDef);

    const result = await vincentPolicy.evaluate(
      {
        toolParams: validated.toolParams,
        userParams: validated.userParams as UserParamsSchema extends z.ZodType
          ? z.infer<UserParamsSchema>
          : undefined,
      },
      { delegation },
    );

    const { schemaToUse } = getSchemaForPolicyResponseResult({
      value: result,
      allowResultSchema: policyDef.evalAllowResultSchema,
      denyResultSchema: policyDef.evalDenyResultSchema,
    });

    const parsedResult = validateOrDeny(result, schemaToUse, ipfsCid, 'evaluate', 'output');

    if (isPolicyDenyResponse(parsedResult)) {
      return parsedResult as PolicyResponse<EvalAllowResult, EvalDenyResult>;
    }

    return {
      ipfsCid,
      allow: true,
      result: parsedResult as EvalAllowResult,
    };
  } catch (err) {
    return createDenyResult({
      ipfsCid,
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
