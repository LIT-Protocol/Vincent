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
import {
  toVincentTransaction,
  type GenericTransaction,
  type Transaction,
} from './helpers/transaction';
import { signTransaction } from './helpers/signTransaction';
import { signUserOperation } from './helpers/signUserOperation';
import { validateTransaction, validateUserOp } from './helpers/validation';
import { getNonce } from './helpers/getNonce';

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
  packageName: '@lit-protocol/vincent-ability-relay-link-smart-account' as const,
  abilityDescription:
    'A Vincent ability to sign secure cross-chain bridge and swap transactions via Relay.link with ECDSA signatures of the delegator',
  abilityParamsSchema,
  supportedPolicies: supportedPoliciesForAbility([]),

  precheckSuccessSchema,
  precheckFailSchema,

  executeSuccessSchema,
  executeFailSchema,

  precheck: async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    try {
      console.log('[@lit-protocol/vincent-ability-relay-link-smart-account]');
      console.log('[@lit-protocol/vincent-ability-relay-link-smart-account] params:', {
        abilityParams,
      });
      console.log('[@lit-protocol/vincent-ability-relay-link-smart-account] delegator:', {
        delegatorPkpInfo,
      });

      if (isUserOpAbilityParams(abilityParams)) {
        const { alchemyRpcUrl, entryPointAddress, userOp } = abilityParams;

        console.log(
          '[@lit-protocol/vincent-ability-relay-link-smart-account] validating user operation:',
          userOp,
        );
        const { simulationChanges } = await validateUserOp({
          alchemyRpcUrl,
          entryPointAddress,
          userOp,
        });
        console.log(
          '[@lit-protocol/vincent-ability-relay-link-smart-account] user operation validated:',
          userOp,
        );

        return succeed({
          simulationChanges,
        });
      }

      if (isTransactionAbilityParams(abilityParams)) {
        const { alchemyRpcUrl, transaction: relayLinkTransaction, allowedTargets } = abilityParams;

        console.log(
          '[@lit-protocol/vincent-ability-relay-link-smart-account] processing Relay.link transaction:',
          relayLinkTransaction,
        );
        console.log(
          '[@lit-protocol/vincent-ability-relay-link-smart-account] allowedTargets received:',
          allowedTargets,
        );

        // Convert Relay.link transaction to standard format (without nonce for precheck)
        const transaction = toVincentTransaction({
          from: relayLinkTransaction.from as Address,
          to: relayLinkTransaction.to as Address,
          data: relayLinkTransaction.data as Hex,
          value: relayLinkTransaction.value,
          chainId: relayLinkTransaction.chainId,
          gas: relayLinkTransaction.gas,
          gasPrice: relayLinkTransaction.gasPrice,
          maxFeePerGas: relayLinkTransaction.maxFeePerGas,
          maxPriorityFeePerGas: relayLinkTransaction.maxPriorityFeePerGas,
        } as GenericTransaction);

        // For EOA transactions, verify that the sender matches the delegator PKP
        // For smart account transactions, the sender will be the smart account address
        const isEoaTransaction = isAddressEqual(
          getAddress(transaction.from),
          getAddress(delegatorPkpInfo.ethAddress),
        );

        if (isEoaTransaction) {
          console.log(
            '[@lit-protocol/vincent-ability-relay-link-smart-account] EOA transaction detected, verifying sender...',
          );
          assertTransactionSender({
            transaction,
            delegatorAddress: delegatorPkpInfo.ethAddress as Address,
          });
        } else {
          console.log(
            '[@lit-protocol/vincent-ability-relay-link-smart-account] Smart account transaction detected, sender:',
            transaction.from,
          );
        }

        console.log(
          '[@lit-protocol/vincent-ability-relay-link-smart-account] validating transaction...',
        );

        const { simulationChanges } = await validateTransaction({
          alchemyRpcUrl,
          transaction,
          allowedTargets,
        });

        console.log(
          '[@lit-protocol/vincent-ability-relay-link-smart-account] transaction validated',
        );

        return succeed({
          simulationChanges,
        });
      }

      throw new Error('Unsupported ability params payload');
    } catch (error) {
      console.error('[@lit-protocol/vincent-ability-relay-link-smart-account] Error:', error);
      return fail({
        error: `[@lit-protocol/vincent-ability-relay-link-smart-account] Validation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      });
    }
  },

  execute: async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    try {
      console.log('[@lit-protocol/vincent-ability-relay-link-smart-account]');
      console.log('[@lit-protocol/vincent-ability-relay-link-smart-account] params:', {
        abilityParams,
      });
      console.log('[@lit-protocol/vincent-ability-relay-link-smart-account] delegator:', {
        delegatorPkpInfo,
      });

      if (isUserOpAbilityParams(abilityParams)) {
        const { alchemyRpcUrl, entryPointAddress, userOp } = abilityParams;

        console.log(
          '[@lit-protocol/vincent-ability-relay-link-smart-account] validating user operation:',
          userOp,
        );
        const { simulationChanges } = await validateUserOp({
          alchemyRpcUrl,
          entryPointAddress,
          userOp,
        });
        console.log(
          '[@lit-protocol/vincent-ability-relay-link-smart-account] user operation validated:',
          userOp,
        );

        console.log(
          '[@lit-protocol/vincent-ability-relay-link-smart-account] preparing user operation signature...',
        );

        const signature = await signUserOperation({
          alchemyRpcUrl,
          entryPointAddress,
          userOp,
          pkpPublicKey: delegatorPkpInfo.publicKey as Hex,
        });

        console.log(
          '[@lit-protocol/vincent-ability-relay-link-smart-account] signed user operation',
        );

        return succeed({
          signature,
          simulationChanges,
        });
      }

      if (isTransactionAbilityParams(abilityParams)) {
        const { alchemyRpcUrl, transaction: relayLinkTransaction, allowedTargets } = abilityParams;

        console.log(
          '[@lit-protocol/vincent-ability-relay-link-smart-account] processing Relay.link transaction:',
          relayLinkTransaction,
        );

        // Fetch nonce from blockchain
        console.log('[@lit-protocol/vincent-ability-relay-link-smart-account] fetching nonce...');
        const nonce = await getNonce({
          rpcUrl: alchemyRpcUrl,
          address: relayLinkTransaction.from as Address,
        });

        // Convert Relay.link transaction to standard format
        const transaction = toVincentTransaction({
          from: relayLinkTransaction.from as Address,
          to: relayLinkTransaction.to as Address,
          data: relayLinkTransaction.data as Hex,
          value: relayLinkTransaction.value,
          chainId: relayLinkTransaction.chainId,
          nonce,
          gas: relayLinkTransaction.gas,
          gasPrice: relayLinkTransaction.gasPrice,
          maxFeePerGas: relayLinkTransaction.maxFeePerGas,
          maxPriorityFeePerGas: relayLinkTransaction.maxPriorityFeePerGas,
        } as GenericTransaction);

        // For EOA transactions, verify that the sender matches the delegator PKP
        // For smart account transactions, the sender will be the smart account address
        const isEoaTransaction = isAddressEqual(
          getAddress(transaction.from),
          getAddress(delegatorPkpInfo.ethAddress),
        );

        if (isEoaTransaction) {
          console.log(
            '[@lit-protocol/vincent-ability-relay-link-smart-account] EOA transaction detected, verifying sender...',
          );
          assertTransactionSender({
            transaction,
            delegatorAddress: delegatorPkpInfo.ethAddress as Address,
          });
        } else {
          console.log(
            '[@lit-protocol/vincent-ability-relay-link-smart-account] Smart account transaction detected, sender:',
            transaction.from,
          );
        }

        console.log(
          '[@lit-protocol/vincent-ability-relay-link-smart-account] validating transaction...',
        );

        const { simulationChanges } = await validateTransaction({
          alchemyRpcUrl,
          transaction,
          allowedTargets,
        });

        console.log(
          '[@lit-protocol/vincent-ability-relay-link-smart-account] signing transaction...',
        );
        const { signature } = await signTransaction({
          transaction,
          pkpPublicKey: delegatorPkpInfo.publicKey as Hex,
        });

        console.log('[@lit-protocol/vincent-ability-relay-link-smart-account] signed transaction');

        return succeed({
          signature,
          simulationChanges,
        });
      }

      throw new Error('Unsupported ability params payload');
    } catch (error) {
      console.error('[@lit-protocol/vincent-ability-relay-link-smart-account] Error:', error);
      return fail({
        error: `[@lit-protocol/vincent-ability-relay-link-smart-account] Validation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      });
    }
  },
});
