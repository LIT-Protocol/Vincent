import { vincentPolicyHandler } from '@lit-protocol/vincent-tool-sdk';

import { vincentPolicy } from './vincent-policy';
import { toolParamsSchema } from './schemas';

declare const context: {
  toolIpfsCid: string;
  delegatorPkpEthAddress: string;
};

declare const toolParams: typeof toolParamsSchema;

(async () => {
  return await vincentPolicyHandler({
    vincentPolicy: vincentPolicy,
    context,
    toolParams,
  });
})();
