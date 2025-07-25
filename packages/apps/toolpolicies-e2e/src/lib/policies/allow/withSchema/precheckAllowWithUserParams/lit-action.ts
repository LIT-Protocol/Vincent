import { vincentPolicyHandler } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

import { vincentPolicy } from './vincent-policy';
import {
  toolParams as toolParamsSchema,
  policyParams as policyParamsSchema,
} from '../../../../schemas';

declare const toolParams: z.infer<typeof toolParamsSchema>;
declare const userParams: z.infer<typeof policyParamsSchema>;
declare const context: {
  toolIpfsCid: string;
  delegatorPkpEthAddress: string;
};

(async () => {
  const func = vincentPolicyHandler({
    vincentPolicy: vincentPolicy,
    toolParams,
    userParams,
    context,
  });
  await func();
})();
