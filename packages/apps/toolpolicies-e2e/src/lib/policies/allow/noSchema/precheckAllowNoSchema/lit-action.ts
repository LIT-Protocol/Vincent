import { vincentPolicyHandler } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

import { vincentPolicy } from './vincent-policy';
import { policyParams as policyParamsSchema } from '../../../../schemas';

declare const context: {
  toolIpfsCid: string;
  delegatorPkpEthAddress: string;
};

declare const toolParams: z.infer<typeof policyParamsSchema>;

(async () => {
  return await vincentPolicyHandler({
    vincentPolicy: vincentPolicy,
    context,
    toolParams,
  });
})();
