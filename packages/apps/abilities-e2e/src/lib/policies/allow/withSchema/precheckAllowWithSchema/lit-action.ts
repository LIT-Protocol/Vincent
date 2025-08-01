import { vincentPolicyHandler } from '@lit-protocol/vincent-ability-sdk';
import { z } from 'zod';

import { vincentPolicy } from './vincent-policy';
import { policyParams as policyParamsSchema } from '../../../../schemas';

declare const context: {
  abilityIpfsCid: string;
  delegatorPkpEthAddress: string;
};

declare const abilityParams: z.infer<typeof policyParamsSchema>;

(async () => {
  return await vincentPolicyHandler({
    vincentPolicy: vincentPolicy,
    context,
    abilityParams,
  });
})();
