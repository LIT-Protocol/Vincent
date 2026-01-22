import { entryPoint07Address } from 'viem/account-abstraction';
import { z } from 'zod';

import { eip712ParamsSchema } from './eip712';
import { addressSchema, hexSchema } from './hex';
import { alchemyRpcUrlSchema, simulateAssetChangeSchema } from './simulation';
import { transactionSchema } from './transaction';
import { userOpSchema } from './userOperation';

const baseAbilityParamsSchema = z.object({
  alchemyRpcUrl: alchemyRpcUrlSchema,
});

/**
 * Ability params Schemas. Can be to sign either a user operation or a transaction
 */
const userOpAbilityParamsSchema = baseAbilityParamsSchema.extend({
  userOp: userOpSchema.describe(
    'User operation to simulate, validate and sign. This MUST be a valid UserOperation object as defined in the UserOperation schemas.',
  ),
  entryPointAddress: addressSchema
    .optional()
    .default(entryPoint07Address)
    .describe(
      'EntryPoint to use for the simulation. Currently only v0.7 is supported. Defaults to standard v0.7 entryPoint address.',
    ),
  alchemyRpcUrl: alchemyRpcUrlSchema,
  serializedPermissionAccount: z
    .string()
    .describe(
      'Serialized permission account containing both EOA and PKP validator configuration. This was created and signed by the EOA outside the Lit Action.',
    ),
  validAfter: z.number().default(0).describe('Valid after timestamp (for Safe smart accounts)'),
  validUntil: z.number().default(0).describe('Valid until timestamp (for Safe smart accounts)'),
  safe4337ModuleAddress: addressSchema
    .default('0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226')
    .describe('Safe 4337 Module address (for Safe smart accounts)'),
  eip712Params: eip712ParamsSchema
    .optional()
    .describe('EIP-712 signing parameters for non-standard signing (e.g. Safe smart accounts)'),
});

const transactionAbilityParamsSchema = baseAbilityParamsSchema.extend({
  alchemyRpcUrl: alchemyRpcUrlSchema,
  transaction: transactionSchema.describe(
    'EOA transaction to simulate, validate and sign. This must be a valid and complete transaction.',
  ),
});

export const abilityParamsSchema = z.union([
  userOpAbilityParamsSchema,
  transactionAbilityParamsSchema,
]);

export type UserOpAbilityParams = z.infer<typeof userOpAbilityParamsSchema>;
export type TransactionAbilityParams = z.infer<typeof transactionAbilityParamsSchema>;
export type AbilityParams = z.infer<typeof abilityParamsSchema>;

export const isUserOpAbilityParams = (params: AbilityParams): params is UserOpAbilityParams =>
  'userOp' in params;
export const isTransactionAbilityParams = (
  params: AbilityParams,
): params is TransactionAbilityParams => 'transaction' in params;

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
  modifiedUserOp: userOpSchema
    .optional()
    .describe(
      'Modified user operation with validator installation bundled (if PKP validator was not yet enabled)',
    ),
});
