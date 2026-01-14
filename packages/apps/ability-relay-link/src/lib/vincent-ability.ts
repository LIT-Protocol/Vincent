import { createVincentGatedSignerAbility } from '@lit-protocol/vincent-ability-sdk/gatedSigner';

import { decodeTransaction } from './decodeTransaction';
import { validateSimulation } from './validateSimulation';
import { validateTransaction } from './validateTransaction';

export const vincentAbility = createVincentGatedSignerAbility({
  packageName: '@lit-protocol/vincent-ability-relay-link' as const,
  abilityDescription:
    'A Vincent ability to sign secure Relay.link cross-chain swap and bridge transactions with the ECDSA signatures of the delegator',

  decodeTransaction,
  validateSimulation,
  validateTransaction,
});
