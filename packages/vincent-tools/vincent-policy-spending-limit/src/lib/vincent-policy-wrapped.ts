import { vincentPolicyHandler } from '@lit-protocol/vincent-tool-sdk';

import { VincentPolicySpendingLimit, toolParamsSchema } from './vincent-policy';

declare const context: { delegation: { delegator: string; delegatee: string } };
declare const toolParams: typeof toolParamsSchema;

(async () => {
  return await vincentPolicyHandler({
    vincentPolicy: VincentPolicySpendingLimit,
    context,
    toolParams,
  });
})();
