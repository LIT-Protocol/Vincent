import {
  createVincentAbility,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { Hex, type Address, getAddress, isAddressEqual } from 'viem';

import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  precheckSuccessSchema,
  abilityParamsSchema,
  type AbilityParams,
  type TransactionAbilityParams,
  type UserOpAbilityParams,
} from './schemas';
import { Transaction } from './helpers/transaction';
import { signTransaction } from './helpers/signTransaction';
import { signUserOperation } from './helpers/signUserOperation';
import { validateTransaction, validateUserOp } from './helpers/validation';

const isUserOpAbilityParams = (params: AbilityParams): params is UserOpAbilityParams =>
  'userOp' in params;
const isTransactionAbilityParams = (params: AbilityParams): params is TransactionAbilityParams =>
  'transaction' in params;

function assertTransactionSender({
  transaction,
  delegatorAddress,
}: {
  transaction: Transaction;
  delegatorAddress: Address;
}) {
  if (!isAddressEqual(getAddress(transaction.from), getAddress(delegatorAddress))) {
    throw new Error(
      'Transaction "from" must match the delegator PKP address. PKP cannot sign transactions on behalf of another EOA',
    );
  }
}

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

      if (isUserOpAbilityParams(abilityParams)) {
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
      }

      if (isTransactionAbilityParams(abilityParams)) {
        const { alchemyRpcUrl, transaction } = abilityParams;

        console.log(
          '[@lit-protocol/vincent-ability-aave-smart-account] validating transaction:',
          transaction,
        );

        assertTransactionSender({
          transaction,
          delegatorAddress: delegatorPkpInfo.ethAddress as Address,
        });

        const { simulationChanges } = await validateTransaction({
          alchemyRpcUrl,
          transaction,
        });

        console.log(
          '[@lit-protocol/vincent-ability-aave-smart-account] transaction validated:',
          transaction,
        );

        return succeed({
          simulationChanges,
        });
      }

      throw new Error('Unsupported ability params payload');
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

      if (isUserOpAbilityParams(abilityParams)) {
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
      }

      if (isTransactionAbilityParams(abilityParams)) {
        const { alchemyRpcUrl, transaction } = abilityParams;

        console.log(
          '[@lit-protocol/vincent-ability-aave-smart-account] validating transaction:',
          transaction,
        );

        assertTransactionSender({
          transaction,
          delegatorAddress: delegatorPkpInfo.ethAddress as Address,
        });

        const { simulationChanges } = await validateTransaction({
          alchemyRpcUrl,
          transaction,
        });

        console.log(
          '[@lit-protocol/vincent-ability-aave-smart-account] transaction validated:',
          transaction,
        );

        const { signature } = await signTransaction({
          transaction,
          pkpPublicKey: delegatorPkpInfo.publicKey as Hex,
        });

        return succeed({
          signature,
          simulationChanges,
        });
      }

      throw new Error('Unsupported ability params payload');
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
