/**
 * Action types for Hyperliquid ability
 */
export enum HyperliquidAction {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  SEND_SPOT_ASSET = 'sendSpotAsset',
  SEND_PERP_USDC = 'sendPerpUsdc',
  TRANSFER_TO_SPOT = 'transferToSpot',
  TRANSFER_TO_PERP = 'transferToPerp',
  SPOT_BUY = 'spotBuy',
  SPOT_SELL = 'spotSell',
  PERP_LONG = 'perpLong',
  PERP_SHORT = 'perpShort',
  CANCEL_ORDER = 'cancelOrder',
  CANCEL_ALL_ORDERS_FOR_SYMBOL = 'cancelAllOrdersForSymbol',
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

export const ARBITRUM_USDC_ADDRESS_MAINNET = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
