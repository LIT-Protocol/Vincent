import { z } from 'zod';

export const actionTypeSchema = z.enum([
  'deposit',
  'withdraw',
  'transferToSpot',
  'transferToPerp',
  'spotBuy',
  'spotSell',
  'perpLong',
  'perpShort',
  'cancelOrder',
  'cancelAllOrdersForSymbol',
]);

export const depositParamsSchema = z.object({
  amount: z.string().describe('Amount of USDC to deposit (minimum 6 USDC: 5 USDC + 1 USDC fee)'),
});

export const withdrawParamsSchema = z.object({
  amount: z
    .string()
    .describe(
      'Amount of USDC to withdraw from Hyperliquid to L1 (Arbitrum), specified in micro-units as a string (e.g., "1000000" means 1.0 USDC; 1 USDC = 1,000,000 micro-units).',
    ),
  destination: z
    .string()
    .optional()
    .describe(
      'Destination address on L1 (Arbitrum) to receive the withdrawn USDC. If not provided, defaults to the Agent Wallet PKP ETH address.',
    ),
});

export const transferParamsSchema = z.object({
  amount: z
    .string()
    .describe(
      'Amount of USDC to transfer to spot or perp, specified in micro-units as a string (e.g., "1000000" means 1.0 USDC; 1 USDC = 1,000,000 micro-units).',
    ),
});

export const orderTypeSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('limit'),
    tif: z
      .enum(['Gtc', 'Ioc', 'Alo'])
      .describe(
        'Time in force: Gtc (Good Till Canceled), Ioc (Immediate Or Cancel), Alo (Add Liquidity Only)',
      ),
  }),
  z.object({
    type: z.literal('market'),
  }),
]);

export const spotTradeParamsSchema = z
  .object({
    symbol: z.string().describe('Trading pair symbol (e.g., "HYPE/USDC")'),
    price: z.string().describe('Limit price'),
    size: z.string().describe('Order size'),
    orderType: orderTypeSchema
      .optional()
      .describe(
        'Order type: { type: "limit", tif: "Gtc" | "Ioc" | "Alo" } or { type: "market" }. Default: { type: "limit", tif: "Gtc" }',
      ),
  })
  .refine(
    (data) => {
      const parts = data.symbol.split('/');
      return parts.length === 2 && parts[0] && parts[1];
    },
    {
      message: 'Invalid trading pair format. Expected format: BASE/QUOTE (e.g., BTC/USDC)',
    },
  );

export const cancelOrderParamsSchema = z
  .object({
    symbol: z.string().describe('Trading pair symbol (e.g., "PURR/USDC")'),
    orderId: z.number().describe('Order ID to cancel'),
  })
  .refine(
    (data) => {
      const parts = data.symbol.split('/');
      return parts.length === 2 && parts[0] && parts[1];
    },
    {
      message: 'Invalid trading pair format. Expected format: BASE/QUOTE (e.g., BTC/USDC)',
    },
  );

export const cancelAllOrdersForSymbolParamsSchema = z
  .object({
    symbol: z.string().describe('Trading pair symbol to cancel all orders for (e.g., "PURR/USDC")'),
  })
  .refine(
    (data) => {
      const parts = data.symbol.split('/');
      return parts.length === 2 && parts[0] && parts[1];
    },
    {
      message: 'Invalid trading pair format. Expected format: BASE/QUOTE (e.g., BTC/USDC)',
    },
  );

export const perpTradeParamsSchema = z.object({
  symbol: z.string().describe('Perpetual symbol (e.g., "ETH")'),
  price: z.string().describe('Limit price'),
  size: z.string().describe('Order size in base asset'),
  leverage: z.number().min(1).max(10).describe('Leverage multiplier (1-10x)'),
  isCross: z.boolean().optional().describe('Cross leverage (default: true)'),
  reduceOnly: z
    .boolean()
    .optional()
    .describe(
      'Reduce-only: if true, order will only reduce existing position and cannot increase it (default: false). Use this to close positions without worrying about exact size.',
    ),
  orderType: orderTypeSchema
    .optional()
    .describe(
      'Order type: { type: "limit", tif: "Gtc" | "Ioc" | "Alo" } or { type: "market" }. Default: { type: "limit", tif: "Gtc" }',
    ),
});

export const abilityParamsSchema = z
  .object({
    action: actionTypeSchema.describe('Action type to execute'),
    // Network selection
    useTestnet: z
      .boolean()
      .optional()
      .describe('Use Hyperliquid testnet instead of mainnet (default: false)'),
    // Deposit-specific params
    deposit: depositParamsSchema
      .optional()
      .describe('Deposit parameters (required for deposit action)'),
    // Withdraw-specific params
    withdraw: withdrawParamsSchema
      .optional()
      .describe('Withdraw parameters (required for withdraw action)'),
    // Transfer to spot or perps params
    transfer: transferParamsSchema
      .optional()
      .describe(
        'Transfer to spot or perp parameters (required for transferToSpot/transferToPerp action)',
      ),
    // Spot trading params
    spot: spotTradeParamsSchema
      .optional()
      .describe('Spot trading parameters (required for spotBuy/spotSell)'),
    // Perp trading params
    perp: perpTradeParamsSchema
      .optional()
      .describe('Perpetual trading parameters (required for perpLong/perpShort)'),
    // Cancel order params
    cancelOrder: cancelOrderParamsSchema
      .optional()
      .describe('Cancel specific order (required for cancelOrder action)'),
    // Cancel all orders for symbol params
    cancelAllOrdersForSymbol: cancelAllOrdersForSymbolParamsSchema
      .optional()
      .describe('Cancel all orders for a symbol (required for cancelAllOrdersForSymbol action)'),
    // Arbitrum RPC URL
    arbitrumRpcUrl: z.string().optional().describe('Arbitrum RPC URL (required for precheck)'),
  })
  .refine(
    (data) => {
      if (data.action === 'deposit') return !!data.deposit;
      if (data.action === 'withdraw') return !!data.withdraw;
      if (data.action === 'transferToSpot' || data.action === 'transferToPerp')
        return !!data.transfer;
      if (data.action === 'spotBuy' || data.action === 'spotSell') return !!data.spot;
      if (data.action === 'perpLong' || data.action === 'perpShort') return !!data.perp;
      if (data.action === 'cancelOrder') return !!data.cancelOrder;
      if (data.action === 'cancelAllOrdersForSymbol') return !!data.cancelAllOrdersForSymbol;
      return false;
    },
    {
      message: 'Missing required parameters for the specified action',
    },
  );

export const precheckSuccessSchema = z.object({
  action: z.string().describe('Action that was prechecked'),
  availableBalance: z
    .string()
    .optional()
    .describe('The available balance of the asset in the Hyperliquid account'),
});

export const precheckFailSchema = z.object({
  action: z.string().describe('Action that was prechecked'),
  reason: z.string().describe('The reason the precheck failed'),
  availableBalance: z
    .string()
    .optional()
    .describe('The available balance of the asset in the Hyperliquid account'),
  requiredBalance: z
    .string()
    .optional()
    .describe('The required balance of the asset in the Hyperliquid account'),
  balanceAsset: z.string().optional().describe('The asset in the Hyperliquid account'),
});

export const executeFailSchema = z.object({
  action: z.string().describe('Action that was executed'),
  reason: z.string().describe('The reason the execution failed'),
});

export const executeSuccessSchema = z.object({
  action: z.string().describe('Action that was executed'),
  txHash: z.string().optional().describe('Transaction hash (for deposit action)'),
  withdrawResult: z.any().optional().describe('Withdraw result (for withdraw action)'),
  transferResult: z.any().optional().describe('Transfer result (for transferToSpot action)'),
  orderResult: z.any().optional().describe('Order result (for spotBuy/spotSell action)'),
  cancelResult: z
    .any()
    .optional()
    .describe('Cancel result (for spotCancelOrder/spotCancelAll action)'),
});
