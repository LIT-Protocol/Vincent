import { z } from 'zod';

export const actionTypeSchema = z.enum([
  'deposit',
  'transferToSpot',
  'spotBuy',
  'spotSell',
  'perpLong',
  'perpShort',
]);

export const depositParamsSchema = z.object({
  amount: z.string().describe('Amount of USDC to deposit (minimum 6 USDC: 5 USDC + 1 USDC fee)'),
});

export const transferToSpotParamsSchema = z.object({
  amount: z.string().describe('Amount of USDC to transfer to spot (e.g., "100.0")'),
});

export const spotTradeParamsSchema = z.object({
  symbol: z.string().describe('Trading pair symbol (e.g., "HYPE/USDC")'),
  price: z.string().describe('Limit price'),
  size: z.string().describe('Order size'),
});

export const perpTradeParamsSchema = z.object({
  symbol: z.string().describe('Perpetual symbol (e.g., "ETH")'),
  price: z.string().describe('Limit price'),
  size: z.string().describe('Order size in base asset'),
  leverage: z.number().min(1).max(50).optional().describe('Leverage multiplier (default: 2x)'),
  isCross: z.boolean().optional().describe('Cross leverage (default: true)'),
});

export const abilityParamsSchema = z
  .object({
    action: actionTypeSchema.describe('Action type to execute'),
    // Deposit-specific params
    deposit: depositParamsSchema
      .optional()
      .describe('Deposit parameters (required for deposit action)'),
    // Transfer to spot params
    transferToSpot: transferToSpotParamsSchema
      .optional()
      .describe('Transfer to spot parameters (required for transferToSpot action)'),
    // Spot trading params
    spot: spotTradeParamsSchema
      .optional()
      .describe('Spot trading parameters (required for spotBuy/spotSell)'),
    // Perp trading params
    perp: perpTradeParamsSchema
      .optional()
      .describe('Perpetual trading parameters (required for perpLong/perpShort)'),
    // Arbitrum RPC URL
    arbitrumRpcUrl: z.string().optional().describe('Arbitrum RPC URL (required for precheck)'),
  })
  .refine(
    (data) => {
      if (data.action === 'deposit') return !!data.deposit;
      if (data.action === 'transferToSpot') return !!data.transferToSpot;
      if (data.action === 'spotBuy' || data.action === 'spotSell') return !!data.spot;
      if (data.action === 'perpLong' || data.action === 'perpShort') return !!data.perp;
      return false;
    },
    {
      message: 'Missing required parameters for the specified action',
    },
  );

export const precheckSuccessSchema = z.object({
  action: z.string().describe('Action that was prechecked'),
  hyperLiquidAccountAlreadyExists: z
    .boolean()
    .optional()
    .describe('Whether the Hyperliquid account already exists'),
  availableUsdcBalance: z
    .string()
    .optional()
    .describe('The available balance of the USDC in the Hyperliquid account'),
});

export const precheckFailSchema = z.object({
  action: z.string().describe('Action that was prechecked'),
  reason: z.string().describe('The reason the precheck failed'),
  usdcBalance: z.string().optional().describe('The balance of the USDC in the agent wallet PKP'),
  availableUsdcBalance: z
    .string()
    .optional()
    .describe('The available balance of the USDC in the Hyperliquid account'),
});

export const executeFailSchema = z.object({
  action: z.string().describe('Action that was executed'),
  reason: z.string().describe('The reason the execution failed'),
});

export const executeSuccessSchema = z.object({
  action: z.string().describe('Action that was executed'),
  txHash: z.string().optional().describe('Transaction hash (for deposit action)'),
  transferResult: z.any().optional().describe('Transfer result (for transferToSpot action)'),
  openOrders: z.array(z.any()).optional().describe('Open orders after execution'),
  positions: z.any().optional().describe('Positions after execution'),
});
