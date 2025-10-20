import { z } from 'zod';

import { addressSchema, hexSchema } from './schemas';

const userOpBaseSchema = z.object({
  sender: addressSchema.describe('The account making the operation'),
  nonce: z
    .string()
    .regex(/^0x([1-9a-fA-F]+[0-9a-fA-F]*|0)$/)
    .optional()
    .describe('Account nonce or creation salt'),
  callData: hexSchema.describe('Data for operation call'),
  callGasLimit: z
    .string()
    .regex(/^0x([1-9a-fA-F]+[0-9a-fA-F]{0,15})|0$/)
    .optional()
    .describe('Gas allocated for call'),
  verificationGasLimit: z
    .string()
    .regex(/^0x([1-9a-fA-F]+[0-9a-fA-F]{0,15})|0$/)
    .optional()
    .describe('Gas allocated for verification'),
  preVerificationGas: z
    .string()
    .regex(/^0x([1-9a-fA-F]+[0-9a-fA-F]{0,15})|0$/)
    .optional()
    .describe('Gas for pre-verification execution and calldata'),
  maxFeePerGas: z
    .string()
    .regex(/^0x([1-9a-fA-F]+[0-9a-fA-F]{0,15})|0$/)
    .optional()
    .default('0x59682F00') // 1.5 gwei (adjust to network conditions)
    .describe('Maximum fee per gas (EIP-1559)'),
  maxPriorityFeePerGas: z
    .string()
    .regex(/^0x([1-9a-fA-F]+[0-9a-fA-F]{0,15})|0$/)
    .optional()
    .default('0x3B9ACA00') // 1 gwei
    .describe('Max priority fee per gas (EIP-1559)'),
  signature: hexSchema.optional().describe('Data passed during verification.'),
  eip7702Auth: z
    .object({
      chain_id: z
        .string()
        .regex(/^0x([1-9a-fA-F]+[0-9a-fA-F]{0,15})|0$/)
        .optional()
        .describe('The chain Id of the authorization'),
      address: addressSchema.optional().describe('The address of the authorization'),
      nonce: z
        .string()
        .regex(/^0x([1-9a-fA-F]+[0-9a-fA-F]{0,15})|0$/)
        .optional()
        .describe('The nonce for the authorization'),
      y_parity: z
        .string()
        .regex(/^0x([1-9a-fA-F]+[0-9a-fA-F]*|0)$/)
        .optional()
        .describe('Y parity of signed authorization tuple'),
      r: z
        .string()
        .regex(/^0x([1-9a-fA-F]+[0-9a-fA-F]{0,31})|0$/)
        .optional()
        .describe('R of signed authorization tuple'),
      s: z
        .string()
        .regex(/^0x([1-9a-fA-F]+[0-9a-fA-F]{0,31})|0$/)
        .optional()
        .describe('S of signed authorization tuple'),
    })
    .optional(),
});

export const userOpv070Schema = userOpBaseSchema.extend({
  paymaster: addressSchema.optional().describe('Paymaster contract address'),
  paymasterData: hexSchema.optional().describe('Data for paymaster'),
  paymasterVerificationGasLimit: z
    .string()
    .regex(/^0x([1-9a-fA-F]+[0-9a-fA-F]{0,15})|0$/)
    .optional()
    .describe('The gas limit for paymaster verification.'),
  factory: addressSchema
    .optional()
    .describe(
      'The account factory address (needed if and only if the account is not yet on-chain and needs to be created)',
    ),
  factoryData: hexSchema
    .optional()
    .describe('Data for the account factory (only if the account factory exists)'),
  paymasterPostOpGasLimit: z
    .string()
    .regex(/^0x([1-9a-fA-F]+[0-9a-fA-F]{0,15})|0$/)
    .optional()
    .describe(
      'The amount of gas to allocate for the paymaster post-op code (only if a paymaster exists)',
    ),
});

export type UserOpv070 = z.infer<typeof userOpv070Schema>;

// Use z.union when adding new userOp versions
export const userOpSchema = userOpv070Schema;
export type UserOp = z.infer<typeof userOpSchema>;
