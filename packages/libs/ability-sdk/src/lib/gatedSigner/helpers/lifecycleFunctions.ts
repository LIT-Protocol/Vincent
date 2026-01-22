import type { Address, Hex } from 'viem';
import type { z } from 'zod';

import { createPublicClient, http } from 'viem';

import type { AbilityConfigLifecycleFunction } from '../../abilityCore/abilityConfig/types';
import type { LowLevelCall } from './lowLevelCall';
import type { SimulateAssetChangesResponse } from './simulation';

import {
  createKernelAccountWithValidators,
  bundleValidatorInstallationWithTransaction,
  isValidatorEnabled,
} from '../../abilityHelpers/kernelAccountUtils';
import { getUserOpCalls } from './lowLevelCall';
import { isTransactionAbilityParams, isUserOpAbilityParams } from './schemas';
import { signTransaction } from './signTransaction';
import { signUserOperation } from './signUserOperation';
import { assertIsValidTransaction, assertIsValidUserOp } from './validation';

export interface DecodedTransactionError {
  kind: 'error';
  message: string;
}

export interface DecodedTransactionSuccess extends Omit<LowLevelCall, 'data'> {
  args: readonly unknown[] | undefined;
  kind: string;
  fn: string;
}

export type DecodedTransaction = DecodedTransactionSuccess | DecodedTransactionError;

interface ValidationBaseParams {
  chainId: number;
  sender: Address;
}

export interface DecodeTransactionParams {
  transaction: LowLevelCall;
}

export interface ValidateSimulationParams extends ValidationBaseParams {
  simulation: SimulateAssetChangesResponse;
}

export interface ValidateTransactionParams extends ValidationBaseParams {
  decodedTransaction: DecodedTransaction;
}

/**
 * Interface defining the steps required to implement the lifecycle of a Gated Signer Ability.
 */
export interface LifecycleFunctionSteps {
  /**
   * Decodes the transaction data into a more usable format.
   */
  decodeTransaction: (params: DecodeTransactionParams) => DecodedTransaction;
  /**
   * Validates the result of the simulation.
   * Should throw an error if the simulation result is invalid.
   * Can be async to support dynamic address fetching.
   */
  validateSimulation: (params: ValidateSimulationParams) => void | Promise<void>;
  /**
   * Validates the decoded transaction.
   * Should throw an error if the transaction is invalid.
   * Can be async to support dynamic address fetching.
   */
  validateTransaction: (params: ValidateTransactionParams) => void | Promise<void>;
}

interface LifecycleFunctions<
  AbilityParamsSchema extends z.ZodType,
  ExecutePolicies,
  PrecheckPolicies,
  ExecuteSuccessSchema extends z.ZodType,
  ExecuteFailSchema extends z.ZodType,
  PrecheckSuccessSchema extends z.ZodType,
  PrecheckFailSchema extends z.ZodType,
> {
  execute: AbilityConfigLifecycleFunction<
    AbilityParamsSchema,
    ExecutePolicies,
    ExecuteSuccessSchema,
    ExecuteFailSchema
  >;
  precheck: AbilityConfigLifecycleFunction<
    AbilityParamsSchema,
    PrecheckPolicies,
    PrecheckSuccessSchema,
    PrecheckFailSchema
  >;
}

export function buildLifecycleFunctions<
  AbilityParamsSchema extends z.ZodType,
  ExecutePolicies,
  PrecheckPolicies,
  ExecuteSuccessSchema extends z.ZodType,
  ExecuteFailSchema extends z.ZodType,
  PrecheckSuccessSchema extends z.ZodType,
  PrecheckFailSchema extends z.ZodType,
>({
  decodeTransaction,
  validateSimulation,
  validateTransaction,
}: LifecycleFunctionSteps): LifecycleFunctions<
  AbilityParamsSchema,
  ExecutePolicies,
  PrecheckPolicies,
  ExecuteSuccessSchema,
  ExecuteFailSchema,
  PrecheckSuccessSchema,
  PrecheckFailSchema
> {
  async function assertIsValidOperation(abilityParams: z.infer<AbilityParamsSchema>) {
    if (isUserOpAbilityParams(abilityParams)) {
      const { alchemyRpcUrl, entryPointAddress, userOp } = abilityParams;

      const simulationChanges = await assertIsValidUserOp({
        alchemyRpcUrl,
        decodeTransaction,
        entryPointAddress,
        userOp,
        validateSimulation,
        validateTransaction,
      });

      return simulationChanges;
    }

    if (isTransactionAbilityParams(abilityParams)) {
      const { alchemyRpcUrl, transaction } = abilityParams;

      const simulationChanges = await assertIsValidTransaction({
        alchemyRpcUrl,
        decodeTransaction,
        transaction,
        validateSimulation,
        validateTransaction,
      });

      return simulationChanges;
    }

    throw new Error('Unsupported ability params payload. Must pass transaction or userOp');
  }

  const precheck: AbilityConfigLifecycleFunction<
    AbilityParamsSchema,
    PrecheckPolicies,
    PrecheckSuccessSchema,
    PrecheckFailSchema
  > = async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    try {
      console.log('[@lit-protocol/vincent-gated-signer]');
      console.log('[@lit-protocol/vincent-gated-signer] params:', {
        abilityParams,
      });
      console.log('[@lit-protocol/vincent-gated-signer] delegator:', {
        delegatorPkpInfo,
      });

      const simulationChanges = await assertIsValidOperation(abilityParams);

      return succeed({ simulationChanges });
    } catch (error) {
      console.error('[@lit-protocol/vincent-gated-signer] Error:', error);
      return fail({
        error: `[@lit-protocol/vincent-gated-signer] Precheck failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      });
    }
  };

  const execute: AbilityConfigLifecycleFunction<
    AbilityParamsSchema,
    ExecutePolicies,
    ExecuteSuccessSchema,
    ExecuteFailSchema
  > = async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    try {
      const simulationChanges = await assertIsValidOperation(abilityParams);

      if (isTransactionAbilityParams(abilityParams)) {
        const { transaction } = abilityParams;
        const signature = await signTransaction({
          transaction,
          pkpPublicKey: delegatorPkpInfo.publicKey as Hex,
        });

        return succeed({
          signature,
          simulationChanges,
        });
      }

      if (isUserOpAbilityParams(abilityParams)) {
        const {
          alchemyRpcUrl,
          eip712Params,
          entryPointAddress,
          safe4337ModuleAddress,
          userOp,
          validAfter,
          validUntil,
          serializedPermissionAccount,
        } = abilityParams;

        const publicClient = createPublicClient({
          transport: http(alchemyRpcUrl),
        });

        if (!serializedPermissionAccount) {
          throw new Error('serializedPermissionAccount is required');
        }

        const { kernelAccount, permissionValidator } = await createKernelAccountWithValidators({
          publicClient,
          agentSignerAddress: delegatorPkpInfo.ethAddress as Address,
          serializedPermissionAccount,
        });

        const validatorAlreadyEnabled = await isValidatorEnabled({
          publicClient,
          smartAccountAddress: kernelAccount.address,
          permissionValidator,
        });

        let finalUserOp = userOp;
        let modifiedUserOp: typeof userOp | undefined = undefined;

        if (!validatorAlreadyEnabled) {
          console.log(
            '[@lit-protocol/vincent-gated-signer] PKP validator not enabled, bundling installation with transaction',
          );

          const userOpCalls = getUserOpCalls(userOp);
          if (userOpCalls.length === 0) {
            throw new Error('UserOp must contain at least one call');
          }

          const batchedCallData = await bundleValidatorInstallationWithTransaction({
            kernelAccount,
            permissionValidator,
            abilityTransaction: {
              to: userOpCalls[0].to,
              data: userOpCalls[0].data,
              value: userOpCalls[0].value,
            },
          });

          finalUserOp = {
            ...userOp,
            callData: batchedCallData,
          };
          modifiedUserOp = finalUserOp;
        }

        const signature = await signUserOperation({
          alchemyRpcUrl,
          entryPointAddress,
          userOp: finalUserOp,
          pkpPublicKey: delegatorPkpInfo.publicKey as Hex,
          validAfter,
          validUntil,
          safe4337ModuleAddress,
          eip712Params,
        });

        return succeed({
          signature,
          simulationChanges,
          modifiedUserOp,
        });
      }

      throw new Error('Unsupported ability params payload');
    } catch (error) {
      console.error(
        '[@lit-protocol/vincent-gated-signer] Error:',
        error instanceof Error ? error.message : String(error),
      );
      console.error(
        '[@lit-protocol/vincent-gated-signer] Stack:',
        error instanceof Error ? error.stack : 'No stack trace',
      );
      return fail({
        error: `[@lit-protocol/vincent-gated-signer] Execute failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      });
    }
  };

  return {
    execute,
    precheck,
  };
}
