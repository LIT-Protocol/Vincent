import type { Address, PublicClient } from 'viem';

import { z } from 'zod';

import type { Transaction } from './transaction';
import type { UserOp } from './userOperation';

import { hexSchema } from './hex';

/**
 * Validates valid Alchemy RPC URLs, the simulation provider
 */
export const alchemyRpcUrlSchema = z
  .string()
  .regex(/^https:\/\/[a-z0-9-]+\.g\.alchemy\.com\/v2\/.+/, { message: 'Invalid Alchemy RPC URL' })
  .url()
  .describe(
    'Alchemy RPC URL for the desired chain. Will be used to simulate the transaction or user op and define the target chain.',
  );

// Types copied from @account-kit/infra
// Zod schemas are created for runtime validation; types are derived from them to ensure consistency

// Enums and their schemas
export enum SimulateAssetType {
  NATIVE = 'NATIVE',
  ERC20 = 'ERC20',
  ERC721 = 'ERC721',
  ERC1155 = 'ERC1155',
  /**
   * Special contracts that don't follow ERC 721/1155. Currently limited to
   * CryptoKitties and CryptoPunks.
   */
  SPECIAL_NFT = 'SPECIAL_NFT',
}
export const simulateAssetTypeSchema = z.nativeEnum(SimulateAssetType);

export enum SimulateChangeType {
  APPROVE = 'APPROVE',
  TRANSFER = 'TRANSFER',
}
export const simulateChangeTypeSchema = z.nativeEnum(SimulateChangeType);

export const simulateAssetChangeSchema = z.object({
  assetType: simulateAssetTypeSchema,
  changeType: simulateChangeTypeSchema,
  from: hexSchema,
  to: hexSchema,
  rawAmount: z.string().nullable().optional(),
  amount: z.string().nullable().optional(),
  contractAddress: hexSchema.nullable().optional(),
  tokenId: z.string().nullable().optional(),
  decimals: z.number(),
  symbol: z.string(),
  name: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
});

export const simulateAssetChangesErrorSchema = z
  .object({
    message: z.string(),
  })
  .catchall(z.unknown());

export const simulateAssetChangesResponseSchema = z.object({
  changes: z.array(simulateAssetChangeSchema),
  error: simulateAssetChangesErrorSchema.nullable().optional(),
});
export type SimulateAssetChangesResponse = z.infer<typeof simulateAssetChangesResponseSchema>;

export const simulateTransaction = async ({
  publicClient,
  transaction,
}: {
  publicClient: PublicClient;
  transaction: Transaction;
}) => {
  // Convert transaction to RPC-compatible format
  const rpcTransaction = {
    from: transaction.from,
    to: transaction.to,
    data: transaction.data,
    value: transaction.value,
    nonce: transaction.nonce,
    ...(transaction.gas && { gas: transaction.gas }),
    ...(transaction.gasLimit && !transaction.gas && { gas: transaction.gasLimit }),
    ...(transaction.gasPrice && { gasPrice: transaction.gasPrice }),
    ...(transaction.maxFeePerGas && { maxFeePerGas: transaction.maxFeePerGas }),
    ...(transaction.maxPriorityFeePerGas && {
      maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
    }),
    ...(transaction.accessList && { accessList: transaction.accessList }),
  };

  return (await publicClient.request({
    // @ts-expect-error viem types do not include this method
    method: 'alchemy_simulateAssetChanges',
    // @ts-expect-error viem types do not include this method
    params: [rpcTransaction],
  })) as SimulateAssetChangesResponse;
};

export const simulateUserOp = async ({
  entryPointAddress,
  publicClient,
  userOp,
}: {
  entryPointAddress: Address;
  publicClient: PublicClient;
  userOp: UserOp;
}) => {
  return (await publicClient.request({
    // @ts-expect-error viem types do not include this method
    method: 'alchemy_simulateUserOperationAssetChanges',
    // @ts-expect-error viem types do not include this method
    params: [userOp, entryPointAddress],
  })) as SimulateAssetChangesResponse;
};
