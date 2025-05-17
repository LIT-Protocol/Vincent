import { vincentPolicyHandler } from '@lit-protocol/vincent-tool-sdk';

import { SpendingLimitPolicyDef, SpendingLimitPolicyToolParamsSchema } from './vincent-policy';

declare const userPkpTokenId: string;
declare const toolParams: typeof SpendingLimitPolicyToolParamsSchema;

(async () =>
  vincentPolicyHandler({
    vincentPolicyDef: SpendingLimitPolicyDef,
    // @ts-expect-error - TODO: fix this
    context: { userPkpTokenId },
    toolParams,
  }))();
