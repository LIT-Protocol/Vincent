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
    'A Vincent ability to do AAVE protocol operations using ZeroDev v3.3 smart accounts user operations with Session Keys',
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

      const { entryPointAddress, userOp, rpcUrl } = abilityParams;

      console.log(
        '[@lit-protocol/vincent-ability-aave-smart-account] validating user operation:',
        userOp,
      );
      const { userOp: processedUserOp, simulationChanges } = await validateUserOp({
        entryPointAddress,
        userOp,
        rpcUrl,
      });
      console.log(
        '[@lit-protocol/vincent-ability-aave-smart-account] user user operation validated:',
        userOp,
      );

      return succeed({
        simulationChanges,
        userOp: processedUserOp,
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

      const { entryPointAddress, userOp, rpcUrl, serializedZeroDevPermissionAccount } =
        abilityParams;

      console.log(
        '[@lit-protocol/vincent-ability-aave-smart-account] validating user operation:',
        userOp,
      );
      const { userOp: processedUserOp, simulationChanges } = await validateUserOp({
        entryPointAddress,
        userOp,
        rpcUrl,
      });
      console.log(
        '[@lit-protocol/vincent-ability-aave-smart-account] user operation validated:',
        userOp,
      );

      console.log(
        '[@lit-protocol/vincent-ability-aave-smart-account] preparing user operation signature...',
      );

      userOp.signature = await signUserOperation({
        pkpPublicKey: delegatorPkpInfo.publicKey as Hex,
        rpcUrl,
        serializedZeroDevPermissionAccount,
        userOp,
      });

      console.log('[@lit-protocol/vincent-ability-aave-smart-account] signed user operation');
      return succeed({
        simulationChanges,
        userOp: processedUserOp,
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
