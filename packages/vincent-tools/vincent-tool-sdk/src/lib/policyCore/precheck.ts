// src/lib/policyCore/precheck.ts

import { z } from 'zod';
import { PolicyResponse, VincentPolicyDef } from '../types';
import { createDenyResult } from './helpers';
import { isPolicyDenyResponse } from './helpers';
import { getValidatedParamsOrDeny, validateOrDeny } from './helpers';
import { getSchemaForPolicyResponseResult } from './helpers';
import { createVincentPolicy } from './vincentPolicy';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Executes the `precheck` method on a wrapped VincentPolicyDef, with runtime validation
 * on input and output using the Zod schemas defined by the policy.
 */
export async function precheck<
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
  PrecheckAllowResult extends z.ZodType<any, any, any> | undefined = VincentPolicyDef<
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
  >['precheckAllowResultSchema'],
  PrecheckDenyResult extends z.ZodType<any, any, any> | undefined = VincentPolicyDef<
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
  >['precheckDenyResultSchema'],
>(
  policyDef: VincentPolicyDef<
    any,
    any,
    UserParamsSchema,
    PrecheckAllowResult,
    PrecheckDenyResult,
    any,
    any,
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
): Promise<PolicyResponse<PrecheckAllowResult, PrecheckDenyResult>> {
  const { toolParams, userParams, delegation } = args;
  const { ipfsCid } = policyDef;

  try {
    const vincentPolicy = createVincentPolicy(policyDef);

    const validated = getValidatedParamsOrDeny({
      policyDef,
      rawToolParams: toolParams,
      rawUserParams: userParams,
      ipfsCid,
      phase: 'precheck',
    });

    if (isPolicyDenyResponse(validated)) {
      return validated as PolicyResponse<PrecheckAllowResult, PrecheckDenyResult>;
    }

    if (!vincentPolicy.precheck) {
      throw new Error('Expected precheck function, but none was defined!');
    }

    const result = await vincentPolicy.precheck(
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
      allowResultSchema: policyDef.precheckAllowResultSchema,
      denyResultSchema: policyDef.precheckDenyResultSchema,
    });

    const parsedResult = validateOrDeny(result, schemaToUse, ipfsCid, 'precheck', 'output');

    if (isPolicyDenyResponse(parsedResult)) {
      return parsedResult as PolicyResponse<PrecheckAllowResult, PrecheckDenyResult>;
    }

    return {
      ipfsCid,
      allow: true,
      result: parsedResult as PrecheckAllowResult,
    };
  } catch (err) {
    return createDenyResult({
      ipfsCid,
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
