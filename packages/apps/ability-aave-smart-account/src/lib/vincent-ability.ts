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
import { getAaveAddresses, getATokens } from './helpers/aave';
import {
  assertValidEntryPointAddress,
  getSmartAccountNonce,
  hashUnpackedUserOp,
} from './helpers/entryPoint';
import {
  estimateUserOperationGas,
  getUserOpInitCode,
  getUserOpVersion,
  simulateUserOp,
  UserOp,
  UserOpv060,
} from './helpers/userOperation';
import { validateSimulation } from './helpers/validation';

interface ProccessUserOpParams {
  entryPointAddress: string;
  userOp: UserOp;
  rpcUrl: string;
}

async function validateUserOp(params: ProccessUserOpParams) {
  const { entryPointAddress, userOp, rpcUrl } = params;
  const _userOp = { ...userOp };

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  await assertValidEntryPointAddress(entryPointAddress, provider);

  const network = await provider.detectNetwork();
  const { POOL: aavePoolAddress } = getAaveAddresses(network.chainId);
  const aaveATokens = getATokens(network.chainId);

  const userOpVersion = getUserOpVersion(_userOp);

  // Complete userOp optional fields
  if (!_userOp.nonce) {
    _userOp.nonce = ethers.utils.hexValue(
      await getSmartAccountNonce({
        entryPointAddress,
        provider,
        accountAddress: _userOp.sender,
      }),
    );
  }
  if (!_userOp.callGasLimit || !_userOp.preVerificationGas || !_userOp.verificationGasLimit) {
    const gasEst = await estimateUserOperationGas({
      entryPointAddress,
      provider,
      userOp: _userOp,
    });
    if (gasEst?.callGasLimit) _userOp.callGasLimit = gasEst.callGasLimit;
    if (gasEst?.verificationGasLimit) _userOp.verificationGasLimit = gasEst.verificationGasLimit;
    if (gasEst?.preVerificationGas) _userOp.preVerificationGas = gasEst.preVerificationGas;
  }
  if (userOpVersion === '0.6.0') {
    const _userOp060 = _userOp as UserOpv060;

    if (!('initCode' in _userOp)) {
      _userOp060.initCode = await getUserOpInitCode({
        accountAddress: _userOp.sender,
        provider,
      });
    }
  }

  // TODO Decode userOp to get token, pool and amount and validate there is nothing extra in the userOp
  // Also the calldata will define the smart account implementation for initCode

  // Simulate userOp
  const simulation = await simulateUserOp({
    provider,
    entryPoint: entryPointAddress,
    userOp: _userOp,
  });
  validateSimulation({
    aaveATokens,
    aavePoolAddress,
    simulation,
    entryPointAddress,
    userOp: _userOp,
  });

  return {
    simulationChanges: simulation.changes,
    userOp: _userOp,
  };
}

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
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const userOpVersion = getUserOpVersion(processedUserOp);

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
      processedUserOp.signature = await Lit.Actions.signAndCombineEcdsa({
        toSign: message,
        sigName: 'user-operation-signature',
        publicKey: delegatorPkpInfo.publicKey,
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
