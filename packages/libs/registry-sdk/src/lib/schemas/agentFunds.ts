import { EXAMPLE_WALLET_ADDRESS } from '../constants';
import { z } from './openApiZod';

// Request schema
export const getAgentFundsRequest = z
  .object({
    userControllerAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/)
      .openapi({
        description: 'The Ethereum address of the user controller wallet',
        example: EXAMPLE_WALLET_ADDRESS,
      }),
    networks: z.array(z.string()).openapi({
      description: 'Networks to query for token balances',
      example: ['base-mainnet', 'base-sepolia'],
    }),
  })
  .strict();

// Token metadata schema (internal)
const tokenMetadataSchema = z
  .object({
    decimals: z.number().openapi({ description: 'Token decimals', example: 18 }),
    logo: z.string().nullable().openapi({ description: 'Token logo URL' }),
    name: z.string().openapi({ description: 'Token name', example: 'USD Coin' }),
    symbol: z.string().openapi({ description: 'Token symbol', example: 'USDC' }),
  })
  .strict();

// Token price schema (internal)
const tokenPriceSchema = z
  .object({
    currency: z.string().openapi({ description: 'Price currency', example: 'usd' }),
    value: z.string().openapi({ description: 'Price value', example: '1.00' }),
    lastUpdatedAt: z
      .string()
      .openapi({ description: 'Last price update timestamp', example: '2024-01-01T00:00:00Z' }),
  })
  .strict();

// Token schema (internal)
const tokenSchema = z
  .object({
    address: z.string().openapi({ description: 'Wallet address that holds the token' }),
    network: z.string().openapi({ description: 'Network identifier', example: 'base-mainnet' }),
    tokenAddress: z.string().openapi({ description: 'Token contract address' }),
    tokenBalance: z.string().openapi({ description: 'Token balance in wei/smallest unit' }),
    tokenMetadata: tokenMetadataSchema.optional(),
    tokenPrices: z.array(tokenPriceSchema).optional(),
    error: z.string().nullable().optional().openapi({ description: 'Error message if applicable' }),
  })
  .strict();

// Response schema
export const getAgentFundsResponse = z
  .object({
    agentAddress: z.string().openapi({
      description: 'The derived agent smart account address',
      example: EXAMPLE_WALLET_ADDRESS,
    }),
    tokens: z.array(tokenSchema).openapi({
      description: 'List of tokens held by the agent',
    }),
    pageKey: z.string().optional().openapi({
      description: 'Pagination key for fetching more results',
    }),
  })
  .strict();

export type GetAgentFundsRequest = z.infer<typeof getAgentFundsRequest>;
export type GetAgentFundsResponse = z.infer<typeof getAgentFundsResponse>;
