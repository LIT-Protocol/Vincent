import { vincentPolicyHandler } from '@lit-protocol/vincent-tool-sdk';

import { SpendingLimitPolicyDef, SpendingLimitPolicyToolParamsSchema } from './vincent-policy';

declare const userPkpTokenId: string;
declare const toolParams: typeof SpendingLimitPolicyToolParamsSchema;
declare const LitAuth: {
  authSigAddress: string;
};

(async () =>
  vincentPolicyHandler({
    vincentPolicy: SpendingLimitPolicyDef,
    context: { delegation: { delegator: userPkpTokenId, delegatee: LitAuth.authSigAddress } },
    toolParams,
  }))();
