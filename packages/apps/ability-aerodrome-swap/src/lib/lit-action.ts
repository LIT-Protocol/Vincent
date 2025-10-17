import { vincentAbilityHandler } from '@lit-protocol/vincent-ability-sdk';
import { z } from 'zod';

// FIXME: This should be generated code

import { vincentAbility } from './vincent-ability';
import { abilityParamsSchema } from './schemas';

declare const abilityParams: z.infer<typeof abilityParamsSchema>;
declare const context: {
  delegatorPkpEthAddress: string;
};

(async () => {
  const func = vincentAbilityHandler({
    vincentAbility: vincentAbility,
    context: {
      delegatorPkpEthAddress: context.delegatorPkpEthAddress,
    },
    abilityParams,
  });
  await func();
})();
