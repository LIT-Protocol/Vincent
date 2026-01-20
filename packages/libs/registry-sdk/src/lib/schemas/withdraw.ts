import { EXAMPLE_WALLET_ADDRESS } from '../constants';
import { z } from './openApiZod';

// Asset schema for withdrawal requests
export const assetSchema = z
  .object({
    network: z.string().openapi({
      description: 'Network identifier (e.g., "ethereum", "base-mainnet")',
      example: 'base-mainnet',
    }),
    tokenAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/)
      .openapi({
        description:
          'ERC-20 contract address. Use zero address (0x0000000000000000000000000000000000000000) for native tokens',
        example: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      }),
    amount: z.number().positive().openapi({
      description: 'Amount to withdraw, naturalized by the token decimal value',
      example: 100,
    }),
  })
  .strict();

// Request withdraw schemas
export const requestWithdrawRequest = z
  .object({
    userControllerAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/)
      .openapi({
        description:
          'EOA address that controls the user smart wallet, used to derive the agent smart account',
        example: EXAMPLE_WALLET_ADDRESS,
      }),
    assets: z.array(assetSchema).min(1).openapi({
      description:
        'Array of assets to withdraw. Assets on the same network will be batched into a single UserOperation',
    }),
  })
  .strict();

// Single withdrawal data (per network)
const withdrawalDataSchema = z
  .object({
    network: z.string().openapi({
      description: 'Network identifier for this withdrawal',
      example: 'base-mainnet',
    }),
    userOp: z.object({}).passthrough().openapi({
      description:
        'The ERC-4337 UserOperation. Pass this back to complete-withdraw along with the signature.',
    }),
    userOpHash: z.string().openapi({
      description:
        'The hash to sign. Sign this with your EOA wallet using personal_sign or signMessage.',
      example: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    }),
  })
  .strict();

// Error schema for failed operations
const withdrawErrorSchema = z
  .object({
    network: z.string().openapi({
      description: 'Network identifier where the error occurred',
      example: 'base-mainnet',
    }),
    error: z.string().openapi({
      description: 'Error message describing what went wrong',
      example: 'Insufficient balance for USDC: requested 100, available 50',
    }),
  })
  .strict();

export const requestWithdrawResponse = z
  .object({
    withdrawals: z.array(withdrawalDataSchema).openapi({
      description:
        'Array of UserOperations, one per unique network. Sign each to authorize withdrawals on that network',
    }),
    errors: z.array(withdrawErrorSchema).optional().openapi({
      description: 'Array of errors for networks that failed to prepare',
    }),
  })
  .strict();

// Complete withdraw schemas
export const signedWithdrawalSchema = z
  .object({
    network: z.string().openapi({
      description: 'Network identifier for this signed withdrawal',
      example: 'base-mainnet',
    }),
    userOp: z.object({}).passthrough().openapi({
      description: 'The userOp object returned from request-withdraw',
    }),
    signature: z.string().openapi({
      description: 'The signature of the UserOperation hash from the user EOA wallet',
      example: '0x1234567890abcdef...',
    }),
  })
  .strict();

export const completeWithdrawRequest = z
  .object({
    withdrawals: z.array(signedWithdrawalSchema).min(1).openapi({
      description: 'Array of signed UserOperations to submit to the ZeroDev bundler',
    }),
  })
  .strict();

// Single transaction result
const withdrawTransactionSchema = z
  .object({
    network: z.string().openapi({
      description: 'Network identifier for this transaction',
      example: 'base-mainnet',
    }),
    transactionHash: z.string().openapi({
      description: 'The transaction hash of the completed withdrawal',
      example: '0x9d260d1bbe075be0cda52a3271df062748f3182ede91b3aae5cd115f7b26552b',
    }),
    userOpHash: z.string().optional().openapi({
      description: 'The UserOperation hash',
      example: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    }),
  })
  .strict();

export const completeWithdrawResponse = z
  .object({
    transactions: z.array(withdrawTransactionSchema).openapi({
      description: 'Array of completed transactions, one per network',
    }),
    errors: z.array(withdrawErrorSchema).optional().openapi({
      description: 'Array of errors for networks that failed to complete',
    }),
  })
  .strict();

// Type exports
export type Asset = z.infer<typeof assetSchema>;
export type RequestWithdrawRequest = z.infer<typeof requestWithdrawRequest>;
export type RequestWithdrawResponse = z.infer<typeof requestWithdrawResponse>;
export type SignedWithdrawal = z.infer<typeof signedWithdrawalSchema>;
export type CompleteWithdrawRequest = z.infer<typeof completeWithdrawRequest>;
export type CompleteWithdrawResponse = z.infer<typeof completeWithdrawResponse>;
