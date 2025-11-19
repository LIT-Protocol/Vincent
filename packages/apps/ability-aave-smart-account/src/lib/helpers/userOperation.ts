import { Address, ByteArray, Hex, isHex, toHex } from 'viem';
import { z } from 'zod';

import { addressSchema, hexSchema } from './schemas';

const userOpBaseSchema = z.object({
  sender: addressSchema.describe('The account making the operation'),
  nonce: z
    .string()
    .regex(/^0x([1-9a-fA-F]+[0-9a-fA-F]*|0)$/)
    .describe('Account nonce or creation salt'),
  callData: hexSchema.describe('Data for operation call'),
  callGasLimit: z
    .string()
    .regex(/^0x([1-9a-fA-F]+[0-9a-fA-F]{0,15})|0$/)
    .describe('Gas allocated for call'),
  verificationGasLimit: z
    .string()
    .regex(/^0x([1-9a-fA-F]+[0-9a-fA-F]{0,15})|0$/)
    .describe('Gas allocated for verification'),
  preVerificationGas: z
    .string()
    .regex(/^0x([1-9a-fA-F]+[0-9a-fA-F]{0,15})|0$/)
    .describe('Gas for pre-verification execution and calldata'),
  maxFeePerGas: z
    .string()
    .regex(/^0x([1-9a-fA-F]+[0-9a-fA-F]{0,15})|0$/)
    .describe('Maximum fee per gas (EIP-1559)'),
  maxPriorityFeePerGas: z
    .string()
    .regex(/^0x([1-9a-fA-F]+[0-9a-fA-F]{0,15})|0$/)
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

export const userOpV070Schema = userOpBaseSchema.extend({
  paymaster: addressSchema.optional().describe('Paymaster contract address'),
  paymasterData: hexSchema.optional().describe('Data for paymaster'),
  paymasterVerificationGasLimit: z
    .string()
    .regex(/^0x([1-9a-fA-F]+[0-9a-fA-F]{0,15})|0$/)
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
    .describe(
      'The amount of gas to allocate for the paymaster post-op code (only if a paymaster exists)',
    ),
});

export type UserOpV070 = z.infer<typeof userOpV070Schema>;

// Use z.union when adding new userOp versions
export const userOpSchema = userOpV070Schema;
export type UserOp = z.infer<typeof userOpSchema>;

// Utilities to convert generic user operations to Vincent compatible ones
type HexLike = string | number | bigint | boolean | ByteArray;

export interface GenericUserOpV070 {
  callData: Hex;
  callGasLimit: HexLike;
  factory?: Address;
  factoryData?: Hex;
  maxFeePerGas: HexLike;
  maxPriorityFeePerGas: HexLike;
  nonce: HexLike;
  paymaster?: Address;
  paymasterData?: Hex;
  paymasterPostOpGasLimit?: HexLike;
  paymasterVerificationGasLimit?: HexLike;
  preVerificationGas: HexLike;
  signature: Hex;
  verificationGasLimit: HexLike;
}

const hexValues = [
  'callGasLimit',
  'maxFeePerGas',
  'maxPriorityFeePerGas',
  'nonce',
  'paymasterPostOpGasLimit',
  'paymasterVerificationGasLimit',
  'preVerificationGas',
  'verificationGasLimit',
] as const;

export function toVincentUserOp(userOp: GenericUserOpV070): UserOp {
  const _userOp = { ...userOp };

  for (const key of hexValues) {
    if (hexValues.includes(key) && _userOp[key] && !isHex(_userOp[key])) {
      _userOp[key] = toHex(_userOp[key]);
    }
  }

  return _userOp as UserOp;
}
