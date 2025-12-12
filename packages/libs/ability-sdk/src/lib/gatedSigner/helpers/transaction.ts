import type { Address, AccessList, ByteArray, Hex } from 'viem';

import { isHex, toHex } from 'viem';
import { z } from 'zod';

import { addressSchema, hexSchema } from './hex';

const quantityHexSchema = hexSchema.describe(
  'Hex-encoded quantity (for example 0x5208 for gas or 0xde0b6b3a7640000 for value)',
);

const chainIdSchema = z
  .union([z.number().int().nonnegative(), quantityHexSchema])
  .describe('Numeric chain id for the transaction. Can be decimal or hex encoded.');

const accessListSchema = z
  .array(
    z.object({
      address: addressSchema,
      storageKeys: z.array(hexSchema),
    }),
  )
  .describe('EIP-2930/EIP-1559 access list entries');

export const transactionSchema = z
  .object({
    data: hexSchema.describe('Calldata for the transaction.'),
    from: addressSchema.describe('Sender of the transaction. Must be the delegator PKP.'),
    to: addressSchema.describe('Recipient address for the transaction.'),
    value: hexSchema.describe('Hex-encoded value to transfer in wei.'),

    nonce: quantityHexSchema.describe('Hex-encoded nonce for the transaction.'),
    gas: quantityHexSchema.optional().describe('Gas limit for the transaction.'),
    gasLimit: quantityHexSchema.optional().describe('Alias for gas limit.'),

    gasPrice: quantityHexSchema.optional().describe('Legacy gas price.'),
    maxFeePerGas: quantityHexSchema.optional().describe('EIP-1559 maxFeePerGas value.'),
    maxPriorityFeePerGas: quantityHexSchema
      .optional()
      .describe('EIP-1559 maxPriorityFeePerGas value.'),

    chainId: chainIdSchema.describe('Chain ID for the transaction. Required.'),
    type: z
      .union([z.string(), z.number()])
      .optional()
      .describe('Optional transaction type identifier.'),
    accessList: accessListSchema.optional(),
  })
  .refine((data) => data.gas !== undefined || data.gasLimit !== undefined, {
    message: 'Either gas or gasLimit must be provided',
  })
  .refine(
    (data) => {
      const hasLegacyGas = data.gasPrice !== undefined;
      const hasEIP1559Gas =
        data.maxFeePerGas !== undefined && data.maxPriorityFeePerGas !== undefined;
      return hasLegacyGas || hasEIP1559Gas;
    },
    {
      message:
        'Either gasPrice (for legacy) or both maxFeePerGas and maxPriorityFeePerGas (for EIP-1559) must be provided',
    },
  );

export type Transaction = z.infer<typeof transactionSchema>;

// Utilities to convert generic transactions to Vincent compatible ones
type HexLike = string | number | bigint | boolean | ByteArray;

export interface GenericTransaction {
  data?: Hex;
  from?: Address;
  to?: Address | null;
  value?: HexLike;

  nonce: HexLike;
  gas?: HexLike;
  gasLimit?: HexLike;

  gasPrice?: HexLike;
  maxFeePerGas?: HexLike;
  maxPriorityFeePerGas?: HexLike;

  chainId: number | HexLike;
  type?: string | number;
  accessList?: AccessList;
}

const txHexValues = [
  'value',
  'nonce',
  'gas',
  'gasLimit',
  'gasPrice',
  'maxFeePerGas',
  'maxPriorityFeePerGas',
] as const;

function toQuantityHexSafe(value: HexLike): Hex {
  if (isHex(value)) return value as Hex;
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return toHex(BigInt(value));
  }
  return toHex(value as any);
}

export function toVincentTransaction(tx: GenericTransaction): Transaction {
  const _tx: any = { ...tx };

  // Convert quantity-like fields to hex when needed
  for (const key of txHexValues) {
    if (_tx[key] !== undefined) {
      _tx[key] = toQuantityHexSafe(_tx[key] as HexLike);
    }
  }

  // Convert chainId if provided as a hex-like non-number and not already hex
  if (_tx.chainId !== undefined && typeof _tx.chainId !== 'number') {
    _tx.chainId = toQuantityHexSafe(_tx.chainId as HexLike);
  }

  // Normalize accessList storage keys
  if (Array.isArray(_tx.accessList)) {
    _tx.accessList = _tx.accessList.map((entry: AccessList[number]) => ({
      address: entry.address,
      storageKeys: entry.storageKeys.map((k) => toQuantityHexSafe(k)),
    }));
  }

  return _tx as Transaction;
}
