import { vincentPolicyHandler } from '@lit-protocol/vincent-ability-sdk';

import { vincentPolicy } from './vincent-policy';
import { abilityParamsSchema } from './schemas';

declare const context: {
  abilityIpfsCid: string;
  delegatorPkpEthAddress: string;
};

declare const abilityParams: typeof abilityParamsSchema;

(async () => {
  return await vincentPolicyHandler({
    vincentPolicy: vincentPolicy,
    context,
    abilityParams,
  });
})();
