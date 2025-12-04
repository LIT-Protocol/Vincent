// src/type-inference-verification/create-vincent-gated-signer-ability.ts

import { createVincentGatedSignerAbility } from '../lib/gatedSigner/vincentGatedSignerAbility';

export const gatedSignerAbility = createVincentGatedSignerAbility({
  packageName: 'gated-signer-ability@1.0.0',
  abilityDescription: 'Gated Signer Ability',

  decodeTransaction: () => {
    throw new Error('TODO decodeTransaction');
  },
  validateTransaction: () => {
    throw new Error('TODO validateTransaction');
  },
  validateSimulation: () => {
    throw new Error('TODO validateSimulation');
  },
});
