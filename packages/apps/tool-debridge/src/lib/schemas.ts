import { z } from 'zod';

export const Operations = {
  BRIDGE: 'BRIDGE',
  BRIDGE_AND_SWAP: 'BRIDGE_AND_SWAP',
} as const;

export type Operation = (typeof Operations)[keyof typeof Operations];

export const toolParamsSchema = z.object({
  rpcUrl: z.string().url().describe('RPC URL for the source chain'),
  sourceChain: z.string().describe("Source chain ID (e.g., '1' for Ethereum, '8453' for Base)"),
  destinationChain: z
    .string()
    .describe("Destination chain ID (e.g., '1' for Ethereum, '8453' for Base)"),
  sourceToken: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid token address')
    .describe(
      'Source token address (use 0x0000000000000000000000000000000000000000 for native token)',
    ),
  destinationToken: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid token address')
    .describe(
      'Destination token address (use 0x0000000000000000000000000000000000000000 for native token)',
    ),
  amount: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Invalid amount format')
    .refine((val) => parseFloat(val) > 0, 'Amount must be greater than 0')
    .describe("Amount to bridge in token units (e.g., '1000000000000000000' for 1 ETH)"),
  recipientAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address format')
    .describe('Recipient address on destination chain'),
  operation: z
    .enum([Operations.BRIDGE, Operations.BRIDGE_AND_SWAP])
    .describe("Operation type: 'BRIDGE' for simple bridge, 'BRIDGE_AND_SWAP' for bridge with swap"),
  slippageBps: z
    .number()
    .min(0, 'Slippage cannot be negative')
    .max(10000, 'Slippage cannot exceed 100% (10000 bps)')
    .optional()
    .default(100)
    .describe('Slippage tolerance in basis points (100 = 1%)'),
});

export const precheckSuccessSchema = z.object({
  data: z
    .object({
      sourceChain: z.string().describe('Source chain ID'),
      destinationChain: z.string().describe('Destination chain ID'),
      sourceToken: z.string().describe('Source token address'),
      destinationToken: z.string().describe('Destination token address'),
      sourceAmount: z.string().describe('Amount being sent in smallest token unit'),
      estimatedDestinationAmount: z
        .string()
        .describe('Estimated amount to be received on destination chain'),
      estimatedFees: z
        .object({
          protocolFee: z.string().describe('Protocol fee in smallest token unit'),
        })
        .describe('Estimated fees for the transaction'),
      estimatedExecutionTime: z
        .string()
        .describe('Estimated time for the bridge operation in seconds'),
      orderData: z
        .object({
          orderId: z.string().optional().describe('Order ID for tracking the bridge transaction'),
          txData: z
            .string()
            .optional()
            .describe('Transaction data for executing the bridge operation'),
          contractAddress: z.string().describe('Contract address for the bridge operation'),
        })
        .optional()
        .describe('Order data required for executing the bridge transaction'),
    })
    .describe('Precheck response data'),
});

export const precheckFailSchema = z.object({
  error: z.string().describe('Error message describing why the precheck failed'),
});

export const executeSuccessSchema = z.object({
  data: z.object({
    txHash: z.string().describe('Transaction hash of the bridge transaction'),
    sourceChain: z.string().describe('Source chain ID'),
    destinationChain: z.string().describe('Destination chain ID'),
    sourceToken: z.string().describe('Source token address'),
    destinationToken: z.string().describe('Destination token address'),
    sourceAmount: z.string().describe('Amount sent in smallest token unit'),
    orderId: z.string().optional().describe('Order ID for tracking the bridge transaction'),
  }),
});

export const executeFailSchema = z.object({
  error: z.string().describe('Error message describing why the execution failed'),
});
