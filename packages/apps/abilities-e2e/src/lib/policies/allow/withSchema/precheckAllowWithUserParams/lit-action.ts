import { vincentPolicyHandler } from '@lit-protocol/vincent-ability-sdk';
import { z } from 'zod';

import { vincentPolicy } from './vincent-policy';
import {
  abilityParams as abilityParamsSchema,
  policyParams as policyParamsSchema,
} from '../../../../schemas';

declare const abilityParams: z.infer<typeof abilityParamsSchema>;
declare const userParams: z.infer<typeof policyParamsSchema>;
declare const context: {
  abilityIpfsCid: string;
  delegatorPkpEthAddress: string;
};

(async () => {
  const func = vincentPolicyHandler({
    vincentPolicy: vincentPolicy,
    abilityParams,
    userParams,
    context,
  });
  await func();
})();
