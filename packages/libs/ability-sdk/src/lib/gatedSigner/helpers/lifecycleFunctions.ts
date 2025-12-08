import type { Address, Hex } from 'viem';
import type { z } from 'zod';

import type { AbilityConfigLifecycleFunction } from '../../abilityCore/abilityConfig/types';
import type { LowLevelCall } from './lowLevelCall';
import type { SimulateAssetChangesResponse } from './simulation';

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
   */
  validateSimulation: (params: ValidateSimulationParams) => void;
  /**
   * Validates the decoded transaction.
   * Should throw an error if the transaction is invalid.
   */
  validateTransaction: (params: ValidateTransactionParams) => void;
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

      // Sign user operation
      const {
        alchemyRpcUrl,
        eip712Params,
        entryPointAddress,
        safe4337ModuleAddress,
        transaction,
        userOp,
        validAfter,
        validUntil,
      } = abilityParams;

      const signature = isTransactionAbilityParams(abilityParams)
        ? await signTransaction({
            transaction,
            pkpPublicKey: delegatorPkpInfo.publicKey as Hex,
          })
        : await signUserOperation({
            alchemyRpcUrl,
            entryPointAddress,
            userOp,
            pkpPublicKey: delegatorPkpInfo.publicKey as Hex,
            validAfter,
            validUntil,
            safe4337ModuleAddress,
            eip712Params,
          });

      return succeed({
        signature,
        simulationChanges,
      });
    } catch (error) {
      console.error('[@lit-protocol/vincent-gated-signer] Error:', error);
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
