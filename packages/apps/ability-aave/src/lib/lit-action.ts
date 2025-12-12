import type { AbilityParams } from '@lit-protocol/vincent-ability-sdk/gatedSigner';

import { vincentAbilityHandler } from '@lit-protocol/vincent-ability-sdk';

import { vincentAbility } from 'src/lib/vincent-ability';

// FIXME: This should be generated code

declare const abilityParams: AbilityParams;
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
