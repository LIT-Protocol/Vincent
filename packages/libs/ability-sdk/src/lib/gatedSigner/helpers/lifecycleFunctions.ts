import {
  concat,
  createPublicClient,
  encodeFunctionData,
  getAbiItem,
  http,
  pad,
  toFunctionSelector,
  zeroAddress,
  type Address,
  type Hex,
} from 'viem';
import type { z } from 'zod';
import { toEmptyECDSASigner } from '@zerodev/permissions/signers';
import { deserializePermissionAccount, toPermissionValidator } from '@zerodev/permissions';
import { getEntryPoint, KERNEL_V3_3, VALIDATOR_TYPE } from '@zerodev/sdk/constants';
import { toSudoPolicy } from '@zerodev/permissions/policies';
import { readContract } from 'viem/actions';
import { KernelV3_3AccountAbi } from '@zerodev/sdk';

import type { AbilityConfigLifecycleFunction } from '../../abilityCore/abilityConfig/types';
import { getUserOpCalls, type LowLevelCall } from './lowLevelCall';
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
        serializedPermissionAccount,
      } = abilityParams;

      let signature: Hex;
      if (isTransactionAbilityParams(abilityParams)) {
        signature = await signTransaction({
          transaction,
          pkpPublicKey: delegatorPkpInfo.publicKey as Hex,
        });
      } else {
        const emptyPkpEcdsaSigner = toEmptyECDSASigner(delegatorPkpInfo.ethAddress as Address);
        const publicClient = createPublicClient({
          // TODO Replace with relayRpcUrl
          transport: http(alchemyRpcUrl),
        });

        const kernelAccount = await deserializePermissionAccount(
          publicClient,
          getEntryPoint('0.7'),
          KERNEL_V3_3,
          serializedPermissionAccount,
          emptyPkpEcdsaSigner,
        );

        const pkpPermissionValidator = await toPermissionValidator(publicClient, {
          entryPoint: getEntryPoint('0.7'),
          signer: emptyPkpEcdsaSigner,
          policies: [toSudoPolicy({})],
          kernelVersion: KERNEL_V3_3,
        });

        let validatorAlreadyEnabled = false;
        const permissionId = pkpPermissionValidator.getIdentifier();
        try {
          const permissionConfig = await readContract(publicClient, {
            abi: KernelV3_3AccountAbi,
            address: kernelAccount.address,
            functionName: 'permissionConfig',
            args: [permissionId],
          });

          validatorAlreadyEnabled = permissionConfig.signer === pkpPermissionValidator.address;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : (error as unknown);
          console.error(
            '[@lit-protocol/vincent-gated-signer] Error checking if validator is already enabled:',
            errorMessage,
          );
        }

        let finalUserOp = userOp;
        if (!validatorAlreadyEnabled) {
          console.log(
            '[@lit-protocol/vincent-gated-signer] PKP validator not enabled, bundling installation with transaction',
          );

          const userOpCalls = getUserOpCalls(userOp);
          if (userOpCalls.length === 0) {
            throw new Error('UserOp must contain at least one call');
          }

          const enableData = await pkpPermissionValidator.getEnableData(kernelAccount.address);
          const installValidationsCalldata = encodeFunctionData({
            abi: KernelV3_3AccountAbi,
            functionName: 'installValidations',
            args: [
              [pad(concat([VALIDATOR_TYPE.PERMISSION, permissionId]), { size: 21, dir: 'right' })],
              [{ nonce: 1, hook: zeroAddress }],
              [enableData],
              ['0x'],
            ],
          });

          const grantAccessCalldata = encodeFunctionData({
            abi: KernelV3_3AccountAbi,
            functionName: 'grantAccess',
            args: [
              pad(concat([VALIDATOR_TYPE.PERMISSION, permissionId]), { size: 21, dir: 'right' }),
              toFunctionSelector(getAbiItem({ abi: KernelV3_3AccountAbi, name: 'execute' })),
              true,
            ],
          });

          const calls = [
            {
              to: kernelAccount.address,
              value: 0n,
              data: installValidationsCalldata,
            },
            {
              to: kernelAccount.address,
              value: 0n,
              data: grantAccessCalldata,
            },
            ...userOpCalls.map((call) => ({
              to: call.to,
              value: call.value,
              data: call.data,
            })),
          ];

          const batchedCallData = await kernelAccount.encodeCalls(calls);

          finalUserOp = {
            ...userOp,
            callData: batchedCallData,
          };
        }

        signature = await signUserOperation({
          alchemyRpcUrl,
          entryPointAddress,
          userOp: finalUserOp,
          pkpPublicKey: delegatorPkpInfo.publicKey as Hex,
          validAfter,
          validUntil,
          safe4337ModuleAddress,
          eip712Params,
        });
      }

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
