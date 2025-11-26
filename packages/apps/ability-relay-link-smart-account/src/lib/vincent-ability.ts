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
  type RelayLinkTransactionAbilityParams,
} from './schemas';
import { Transaction, toVincentTransaction, type GenericTransaction } from './helpers/transaction';
import { signTransaction } from './helpers/signTransaction';
import { signUserOperation } from './helpers/signUserOperation';
import { validateTransaction, validateUserOp } from './helpers/validation';
import { broadcastTransaction, pollCheckEndpoint } from './helpers/broadcastTransaction';

const isUserOpAbilityParams = (params: AbilityParams): params is UserOpAbilityParams =>
  'userOp' in params;
const isTransactionAbilityParams = (params: AbilityParams): params is TransactionAbilityParams =>
  'transaction' in params;
const isRelayLinkTransactionAbilityParams = (
  params: AbilityParams,
): params is RelayLinkTransactionAbilityParams => 'relayLinkTransaction' in params;

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
        const { alchemyRpcUrl, entryPointAddress, userOp, skipValidation } = abilityParams;

        if (skipValidation) {
          console.log(
            '[@lit-protocol/vincent-ability-relay-link-smart-account] skipping validation (skipValidation=true)',
          );
          return succeed({
            simulationChanges: undefined,
          });
        }

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
        const { alchemyRpcUrl, transaction } = abilityParams;

        console.log(
          '[@lit-protocol/vincent-ability-relay-link-smart-account] validating transaction:',
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
          '[@lit-protocol/vincent-ability-relay-link-smart-account] transaction validated:',
          transaction,
        );

        return succeed({
          simulationChanges,
        });
      }

      if (isRelayLinkTransactionAbilityParams(abilityParams)) {
        const { alchemyRpcUrl, relayLinkTransaction, allowedTargets } = abilityParams;

        console.log(
          '[@lit-protocol/vincent-ability-relay-link-smart-account] processing Relay.link transaction:',
          relayLinkTransaction,
        );
        console.log(
          '[@lit-protocol/vincent-ability-relay-link-smart-account] allowedTargets received:',
          allowedTargets,
        );

        // Fetch nonce from blockchain
        console.log('[@lit-protocol/vincent-ability-relay-link-smart-account] fetching nonce...');
        const nonceResponse = await fetch(alchemyRpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getTransactionCount',
            params: [relayLinkTransaction.from, 'latest'],
          }),
        });
        const nonceResult = (await nonceResponse.json()) as { result: string };
        const nonce = nonceResult.result;

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

        console.log(
          '[@lit-protocol/vincent-ability-relay-link-smart-account] validating transaction...',
        );
        // Note: We don't check that from matches PKP address for Relay.link transactions
        // because they can be from smart accounts where the PKP signs on behalf of the account

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
        const { alchemyRpcUrl, entryPointAddress, userOp, skipValidation } = abilityParams;

        let simulationChanges: any[] | undefined;

        if (skipValidation) {
          console.log(
            '[@lit-protocol/vincent-ability-relay-link-smart-account] skipping validation (skipValidation=true)',
          );
          simulationChanges = undefined;
        } else {
          console.log(
            '[@lit-protocol/vincent-ability-relay-link-smart-account] validating user operation:',
            userOp,
          );
          const validationResult = await validateUserOp({
            alchemyRpcUrl,
            entryPointAddress,
            userOp,
          });
          simulationChanges = validationResult.simulationChanges;
          console.log(
            '[@lit-protocol/vincent-ability-relay-link-smart-account] user operation validated:',
            userOp,
          );
        }

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
        const { alchemyRpcUrl, transaction } = abilityParams;

        console.log(
          '[@lit-protocol/vincent-ability-relay-link-smart-account] validating transaction:',
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
          '[@lit-protocol/vincent-ability-relay-link-smart-account] transaction validated:',
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

      if (isRelayLinkTransactionAbilityParams(abilityParams)) {
        const { alchemyRpcUrl, relayLinkTransaction, checkEndpoint } = abilityParams;

        console.log(
          '[@lit-protocol/vincent-ability-relay-link-smart-account] processing Relay.link transaction:',
          relayLinkTransaction,
        );

        // Fetch nonce from blockchain
        console.log('[@lit-protocol/vincent-ability-relay-link-smart-account] fetching nonce...');
        const nonceResponse = await fetch(alchemyRpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getTransactionCount',
            params: [relayLinkTransaction.from, 'latest'],
          }),
        });
        const nonceResult = (await nonceResponse.json()) as { result: string };
        const nonce = nonceResult.result;

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

        console.log(
          '[@lit-protocol/vincent-ability-relay-link-smart-account] validating transaction...',
        );
        // Note: We don't check that from matches PKP address for Relay.link transactions
        // because they can be from smart accounts where the PKP signs on behalf of the account

        const { simulationChanges } = await validateTransaction({
          alchemyRpcUrl,
          transaction,
        });

        console.log(
          '[@lit-protocol/vincent-ability-relay-link-smart-account] signing transaction...',
        );
        const { signature, signedTransaction } = await signTransaction({
          transaction,
          pkpPublicKey: delegatorPkpInfo.publicKey as Hex,
        });

        console.log(
          '[@lit-protocol/vincent-ability-relay-link-smart-account] broadcasting transaction...',
        );
        const { transactionHash } = await broadcastTransaction({
          rpcUrl: alchemyRpcUrl,
          signedTransaction,
        });
        console.log(
          '[@lit-protocol/vincent-ability-relay-link-smart-account] transaction hash:',
          transactionHash,
        );

        // Poll check endpoint if provided
        if (checkEndpoint) {
          console.log(
            '[@lit-protocol/vincent-ability-relay-link-smart-account] polling check endpoint...',
          );
          await pollCheckEndpoint({ checkEndpoint });
          console.log(
            '[@lit-protocol/vincent-ability-relay-link-smart-account] transaction confirmed by Relay.link',
          );
        }

        return succeed({
          signature,
          simulationChanges,
          transactionHash: transactionHash as Hex,
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
