import { vincentAbilityHandler } from '@lit-protocol/vincent-ability-sdk';
import { z } from 'zod';

import { vincentAbility } from './vincent-ability';
import { abilityParamsSchema } from './schemas';

// FIXME: This should be generated code

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
