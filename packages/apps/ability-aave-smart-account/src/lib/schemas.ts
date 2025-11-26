import { entryPoint07Address } from 'viem/account-abstraction';
import { z } from 'zod';

import { simulateAssetChangeSchema } from './helpers/simulation';
import { addressSchema, hexSchema } from './helpers/schemas';
import { transactionSchema } from './helpers/transaction';
import { userOpSchema } from './helpers/userOperation';

/**
 * Ability parameters schema - defines the input parameters for the AAVE Smart Account ability
 */
const alchemyRpcUrlSchema = z
  .string()
  .regex(/^https:\/\/[a-z0-9-]+\.g\.alchemy\.com\/v2\/.+/, { message: 'Invalid Alchemy RPC URL' })
  .url()
  .describe('Alchemy RPC URL for the desired chain. Will be used to simulate the transaction.');

export const eip712ParamsSchema = z.object({
  domain: z.record(z.any()).describe('EIP-712 domain'),
  types: z
    .record(z.array(z.object({ name: z.string(), type: z.string() })))
    .describe('EIP-712 types'),
  primaryType: z.string().describe('EIP-712 primary type'),
  message: z
    .record(z.string(), z.union([z.string(), z.record(z.string(), z.any())]))
    .describe(
      'EIP-712 message template. Values must be strings starting with $ that resolve to a valid param (e.g. $userOp.sender, $validUntil).',
    )
    .refine(
      (data) => {
        const validateValue = (value: any): boolean => {
          if (typeof value === 'string') {
            return (
              value.startsWith('$') &&
              /^\$(userOp\.(sender|nonce|initCode|callData|callGasLimit|verificationGasLimit|preVerificationGas|maxFeePerGas|maxPriorityFeePerGas|paymasterAndData|signature|factory|factoryData|paymaster|paymasterData|paymasterPostOpGasLimit|paymasterVerificationGasLimit)|entryPointAddress|validAfter|validUntil|safe4337ModuleAddress)$/.test(
                value,
              )
            );
          }
          if (typeof value === 'object' && value !== null) {
            return Object.values(value).every(validateValue);
          }
          return false;
        };
        return Object.values(data).every(validateValue);
      },
      {
        message:
          'Invalid message value. Must be a reference string starting with $ (e.g. $userOp.sender) or a nested object containing references.',
      },
    ),
});

export type Eip712Params = z.infer<typeof eip712ParamsSchema>;

export const userOpAbilityParamsSchema = z.object({
  userOp: userOpSchema.describe(
    'User operation to sign and execute. This MUST be a valid UserOperation object as defined in the UserOperation schemas.',
  ),
  entryPointAddress: addressSchema
    .optional()
    .default(entryPoint07Address)
    .describe(
      'EntryPoint to use for the simulation. Currently only v0.7 is supported. Defaults to standard v0.7 entryPoint address.',
    ),
  alchemyRpcUrl: alchemyRpcUrlSchema,
  validAfter: z
    .number()
    .optional()
    .default(0)
    .describe('Valid after timestamp (for Safe smart accounts)'),
  validUntil: z
    .number()
    .optional()
    .default(0)
    .describe('Valid until timestamp (for Safe smart accounts)'),
  safe4337ModuleAddress: addressSchema
    .optional()
    .default('0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226')
    .describe('Safe 4337 Module address (for Safe smart accounts)'),
  eip712Params: eip712ParamsSchema
    .optional()
    .describe('EIP-712 signing parameters for non-standard signing (e.g. Safe smart accounts)'),
});

export const transactionAbilityParamsSchema = z.object({
  alchemyRpcUrl: alchemyRpcUrlSchema,
  transaction: transactionSchema.describe(
    'EOA transaction to simulate and validate. Only transactions targeting the supported Aave pool or approved ERC20 approvals will be accepted.',
  ),
});

export const abilityParamsSchema = z.union([
  userOpAbilityParamsSchema,
  transactionAbilityParamsSchema,
]);

export type AbilityParams = z.infer<typeof abilityParamsSchema>;
export type UserOpAbilityParams = z.infer<typeof userOpAbilityParamsSchema>;
export type TransactionAbilityParams = z.infer<typeof transactionAbilityParamsSchema>;

/**
 * Failure result schema
 */
const baseFailSchema = z.object({
  error: z.string().describe('A string containing the error message if the precheck failed.'),
});
export const precheckFailSchema = baseFailSchema;
export const executeFailSchema = baseFailSchema;

/**
 * Success result schema
 */
export const precheckSuccessSchema = z.object({
  simulationChanges: z
    .array(simulateAssetChangeSchema)
    .describe('Simulated changes user op will make to the blockchain.'),
});
export const executeSuccessSchema = precheckSuccessSchema.extend({
  signature: hexSchema.describe('ECDSA signature over the received user operation or transaction.'),
});
