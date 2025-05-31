import { vincentPolicyHandler } from '@lit-protocol/vincent-tool-sdk';

import { SpendingLimitPolicyDef, SpendingLimitPolicyToolParamsSchema } from './vincent-policy';

declare const context: { delegation: { delegator: string; delegatee: string } };
declare const toolParams: typeof SpendingLimitPolicyToolParamsSchema;

(() =>
  vincentPolicyHandler({
    vincentPolicy: SpendingLimitPolicyDef,
    context,
    toolParams,
  }))();
