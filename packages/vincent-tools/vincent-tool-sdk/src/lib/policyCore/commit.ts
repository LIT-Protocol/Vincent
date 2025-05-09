// src/lib/policyCore/commit.ts

import { z } from 'zod';
import { VincentToolPolicy, PolicyResponse, VincentPolicyDef } from '../types';
import {
  getSchemaForPolicyResponseResult,
  validateOrDeny,
  isPolicyDenyResponse,
  createDenyResult,
} from './helpers';
import { createVincentPolicy } from './vincentPolicy';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Executes the `commit` lifecycle method on a VincentToolPolicy, validating both
 * the input parameters and the output result using Zod.
 */
export async function commit<
  CommitAllowResult extends z.ZodType<any, any, any> | undefined = VincentToolPolicy<
    any,
    any
  >['policyDef']['commitAllowResultSchema'],
  CommitDenyResult extends z.ZodType<any, any, any> | undefined = VincentToolPolicy<
    any,
    any
  >['policyDef']['commitDenyResultSchema'],
>(
  policyDef: VincentPolicyDef<
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    CommitAllowResult,
    CommitDenyResult,
    any,
    any,
    any
  >,
  args: {
    commitParams: unknown;
    delegation: { delegatee: string; delegator: string };
  },
): Promise<PolicyResponse<CommitAllowResult, CommitDenyResult>> {
  const ipfsCid = policyDef.ipfsCid;
  try {
    const parsedParams = validateOrDeny(
      args.commitParams,
      policyDef.commitParamsSchema,
      ipfsCid,
      'commit',
      'input',
    );

    if (isPolicyDenyResponse(parsedParams)) {
      return parsedParams as PolicyResponse<CommitAllowResult, CommitDenyResult>;
    }

    const vincentPolicy = createVincentPolicy(policyDef);

    if (!vincentPolicy.commit) {
      return createDenyResult({
        ipfsCid,
        message: 'This policy does not define a commit() method.',
      });
    }

    const result = await vincentPolicy.commit(parsedParams, {
      delegation: args.delegation,
    });

    const { schemaToUse } = getSchemaForPolicyResponseResult({
      value: result,
      allowResultSchema: policyDef.commitAllowResultSchema,
      denyResultSchema: policyDef.commitDenyResultSchema,
    });

    const parsedResult = validateOrDeny(result, schemaToUse, ipfsCid, 'commit', 'output');

    if (isPolicyDenyResponse(parsedResult)) {
      return parsedResult as PolicyResponse<CommitAllowResult, CommitDenyResult>;
    }

    return {
      ipfsCid,
      allow: true,
      result: parsedResult as CommitAllowResult,
    };
  } catch (err) {
    return createDenyResult({
      ipfsCid,
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
