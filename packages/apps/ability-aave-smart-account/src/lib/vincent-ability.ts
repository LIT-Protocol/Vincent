import { createVincentGatedSignerAbility } from '@lit-protocol/vincent-ability-sdk/gatedSigner';

import { decodeTransaction } from './decodeTransaction';
import { validateSimulation } from './validateSimulation';
import { validateTransaction } from './validateTransaction';

export const vincentAbility = createVincentGatedSignerAbility({
  packageName: '@lit-protocol/vincent-ability-aave-smart-account' as const,
  abilityDescription:
    'A Vincent ability to sign secure AAVE protocol user operations with ECDSA signatures of the delegator',

  decodeTransaction,
  validateSimulation,
  validateTransaction,
});
