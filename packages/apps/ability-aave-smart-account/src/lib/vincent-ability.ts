import {
  createVincentAbility,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { ethers } from 'ethers';

import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  precheckSuccessSchema,
  abilityParamsSchema,
} from './schemas';
import { getUserOpVersion, hashUnpackedUserOp } from './helpers/entryPoint';
import { UserOpv060 } from './helpers/userOperation';
import { validateUserOp } from './helpers/validation';

export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/vincent-ability-aave-smart-account' as const,
  abilityDescription:
    'A Vincent ability to do AAVE protocol operations using smart accounts user operations',
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
        '[@lit-protocol/vincent-ability-aave-smart-account] final user operation validated:',
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
        '[@lit-protocol/vincent-ability-aave-smart-account] final user operation validated:',
        userOp,
      );

      console.log(
        '[@lit-protocol/vincent-ability-aave-smart-account] preparing user operation signature...',
      );
      const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);
      const userOpVersion = getUserOpVersion(entryPointAddress);

      let message: Uint8Array;
      if (userOpVersion === '0.6.0') {
        const userOp060 = processedUserOp as UserOpv060;
        message = await hashUnpackedUserOp({
          entryPointAddress,
          provider,
          userOp: userOp060,
        });
      } else {
        throw new Error('Only 0.6.0 userOp is supported');
      }

      console.log(
        '[@lit-protocol/vincent-ability-aave-smart-account] signing user operation hash:',
        message,
      );
      const sig = await Lit.Actions.signAndCombineEcdsa({
        toSign: message,
        sigName: 'user-operation-signature',
        publicKey: delegatorPkpInfo.publicKey.replace(/^0x/, ''),
      });
      const signature = JSON.parse(sig);

      const joinSignature = ethers.utils.joinSignature({
        r: '0x' + signature.r.substring(2),
        s: '0x' + signature.s,
        v: signature.v,
      });
      processedUserOp.signature = joinSignature;

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
