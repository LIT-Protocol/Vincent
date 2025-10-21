import { type PublicClient } from 'viem';
import { z } from 'zod';

import { hexSchema } from './schemas';
import { UserOp } from './userOperation';

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

export const simulateAssetChangeSchema = z
  .object({
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
  })
  .strict();
export type SimulateAssetChange = z.infer<typeof simulateAssetChangeSchema>;

export const simulateAssetChangesErrorSchema = z
  .object({
    message: z.string(),
  })
  .catchall(z.unknown());
export type SimulateAssetChangesError = z.infer<typeof simulateAssetChangesErrorSchema>;

export const simulateUserOperationAssetChangesResponseSchema = z
  .object({
    changes: z.array(simulateAssetChangeSchema),
    error: simulateAssetChangesErrorSchema.nullable().optional(),
  })
  .strict();
export type SimulateUserOperationAssetChangesResponse = z.infer<
  typeof simulateUserOperationAssetChangesResponseSchema
>;

export const simulateUserOp = async ({
  entryPoint,
  publicClient,
  userOp,
}: {
  entryPoint: string;
  publicClient: PublicClient;
  userOp: UserOp;
}) => {
  // Simulate UserOperation https://www.alchemy.com/docs/wallets/api-reference/bundler-api/useroperation-simulation-endpoints/alchemy-simulate-user-operation-asset-changes
  return (await publicClient.request({
    // @ts-expect-error viem types do not include this method
    method: 'alchemy_simulateUserOperationAssetChanges',
    // @ts-expect-error viem types do not include this method
    params: [userOp, entryPoint],
  })) as SimulateUserOperationAssetChangesResponse;
};
