/**
 * Action types for Hyperliquid ability
 */
export enum HyperliquidAction {
  DEPOSIT = 'deposit',
  TRANSFER_TO_SPOT = 'transferToSpot',
  TRANSFER_TO_PERP = 'transferToPerp',
  SPOT_BUY = 'spotBuy',
  SPOT_SELL = 'spotSell',
  PERP_LONG = 'perpLong',
  PERP_SHORT = 'perpShort',
  CANCEL_ORDER = 'cancelOrder',
  CANCEL_ALL_ORDERS_FOR_SYMBOL = 'cancelAllOrdersForSymbol',
  APPROVE_BUILDER = 'approveBuilder',
}

/**
 * Time-in-force options for limit orders
 */
export enum TimeInForce {
  /** Good Till Canceled - order stays active until filled or manually canceled */
  GTC = 'Gtc',
  /** Immediate Or Cancel - order fills immediately or cancels */
  IOC = 'Ioc',
  /** Add Liquidity Only - order only fills if it adds liquidity (maker only) */
  ALO = 'Alo',
}

/**
 * Order type for trades
 */
export enum OrderType {
  LIMIT = 'limit',
  MARKET = 'market',
}

export const HYPERLIQUID_BRIDGE_ADDRESS_MAINNET = '0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7';

export const HYPERLIQUID_BRIDGE_ADDRESS_TESTNET = '0xedb6e5c456b7cca2eb1e5c7007f4ab80426cd20f';

export const ARBITRUM_USDC_ADDRESS_MAINNET = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';

export const ARBITRUM_USDC_ADDRESS_TESTNET = '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';
