import {
  createVincentAbility,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { Hex } from 'viem';

import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  precheckSuccessSchema,
  abilityParamsSchema,
} from './schemas';
import { signUserOperation } from './helpers/signUserOperation';
import { validateUserOp } from './helpers/validation';

export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/vincent-ability-aave-smart-account' as const,
  abilityDescription:
    'A Vincent ability to sign secure AAVE protocol user operations with ECDSA signatures of the delegator',
  abilityParamsSchema,
  supportedPolicies: supportedPoliciesForAbility([]),

  precheckSuccessSchema,
  precheckFailSchema,

  executeSuccessSchema,
  executeFailSchema,

  precheck: async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    try {
      console.log('[@lit-protocol/vincent-ability-aave-smart-account]');
      console.log('[@lit-protocol/vincent-ability-aave-smart-account] params:', {
        abilityParams,
      });
      console.log('[@lit-protocol/vincent-ability-aave-smart-account] delegator:', {
        delegatorPkpInfo,
      });

      const { alchemyRpcUrl, entryPointAddress, userOp } = abilityParams;

      console.log(
        '[@lit-protocol/vincent-ability-aave-smart-account] validating user operation:',
        userOp,
      );
      const { simulationChanges } = await validateUserOp({
        alchemyRpcUrl,
        entryPointAddress,
        userOp,
      });
      console.log(
        '[@lit-protocol/vincent-ability-aave-smart-account] user operation validated:',
        userOp,
      );

      return succeed({
        simulationChanges,
      });
    } catch (error) {
      console.error('[@lit-protocol/vincent-ability-aave-smart-account] Error:', error);
      return fail({
        error: `[@lit-protocol/vincent-ability-aave-smart-account] Validation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      });
    }
  },

  execute: async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    try {
      console.log('[@lit-protocol/vincent-ability-aave-smart-account]');
      console.log('[@lit-protocol/vincent-ability-aave-smart-account] params:', {
        abilityParams,
      });
      console.log('[@lit-protocol/vincent-ability-aave-smart-account] delegator:', {
        delegatorPkpInfo,
      });

      const { alchemyRpcUrl, entryPointAddress, userOp } = abilityParams;

      console.log(
        '[@lit-protocol/vincent-ability-aave-smart-account] validating user operation:',
        userOp,
      );
      const { simulationChanges } = await validateUserOp({
        alchemyRpcUrl,
        entryPointAddress,
        userOp,
      });
      console.log(
        '[@lit-protocol/vincent-ability-aave-smart-account] user operation validated:',
        userOp,
      );

      console.log(
        '[@lit-protocol/vincent-ability-aave-smart-account] preparing user operation signature...',
      );

      const signature = await signUserOperation({
        alchemyRpcUrl,
        entryPointAddress,
        userOp,
        pkpPublicKey: delegatorPkpInfo.publicKey as Hex,
      });

      console.log('[@lit-protocol/vincent-ability-aave-smart-account] signed user operation');
      return succeed({
        signature,
        simulationChanges,
      });
    } catch (error) {
      console.error('[@lit-protocol/vincent-ability-aave-smart-account] Error:', error);
      return fail({
        error: `[@lit-protocol/vincent-ability-aave-smart-account] Validation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      });
    }
  },
});
