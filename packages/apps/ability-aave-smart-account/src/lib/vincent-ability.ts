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
import { assertValidEntryPointAddress, getSmartAccountNonce } from './helpers/entryPoint';
import {
  estimateUserOperationGas,
  getUserOpInitCode,
  getUserOpVersion,
  simulateUserOp,
  UserOpv060,
} from './helpers/userOperation';
import { validateSimulation } from './helpers/validation';

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
        if (gasEst?.verificationGasLimit)
          _userOp.verificationGasLimit = gasEst.verificationGasLimit;
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

      return succeed({
        simulationChanges: simulation.changes,
        userOp: _userOp,
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
      console.log('[@lit-protocol/vincent-ability-aave-smart-account/execute]');
      console.log('[@lit-protocol/vincent-ability-aave-smart-account/execute] params:', {
        abilityParams,
      });
      console.log('[@lit-protocol/vincent-ability-aave-smart-account/execute] delegator:', {
        delegatorPkpInfo,
      });

      const { userOp } = abilityParams;
      const _userOp = { ...userOp };

      // TODO same as precheck but we have to sign with the delegator pkp

      _userOp.signature = '0x1234567890';

      return succeed({
        simulationChanges: [],
        userOp: _userOp,
      });
    } catch (error) {
      console.error(
        '[@lit-protocol/vincent-ability-aave-smart-account/execute] Signing user operation failed',
        error,
      );

      return fail({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  },
});
