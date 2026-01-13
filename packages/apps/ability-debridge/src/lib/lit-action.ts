import { vincentAbilityHandler } from '@lit-protocol/vincent-ability-sdk';
import { z } from 'zod';

// FIXME: This should be generated code

import { vincentAbility } from 'src/lib/vincent-ability';
import { abilityParamsSchema } from './schemas';

declare const abilityParams: z.infer<typeof abilityParamsSchema>;
declare const context: {
  agentAddress: string;
  delegatorPkpEthAddress: string;
};

(async () => {
  const func = vincentAbilityHandler({
    vincentAbility: vincentAbility,
    context: {
      agentAddress: context.agentAddress,
      delegatorPkpEthAddress: context.delegatorPkpEthAddress,
    },
    abilityParams,
  });
  await func();
})();
