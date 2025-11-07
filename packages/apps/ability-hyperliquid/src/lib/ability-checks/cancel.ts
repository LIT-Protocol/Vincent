import * as hyperliquid from '@nktkas/hyperliquid';

export type CancelOrderPrechecksResult =
  | CancelOrderPrechecksResultSuccess
  | CancelOrderPrechecksResultFailure;

export interface CancelOrderPrechecksResultSuccess {
  success: true;
}

export interface CancelOrderPrechecksResultFailure {
  success: false;
  reason: string;
}

export interface CancelOrderParams {
  orderId: number;
}

export type CancelAllOrdersForSymbolPrechecksResult =
  | CancelAllOrdersForSymbolPrechecksResultSuccess
  | CancelAllOrdersForSymbolPrechecksResultFailure;

export interface CancelAllOrdersForSymbolPrechecksResultSuccess {
  success: true;
  orderCount: number;
}

export interface CancelAllOrdersForSymbolPrechecksResultFailure {
  success: false;
  reason: string;
}

export interface CancelAllOrdersForSymbolParams {
  symbol: string;
}

/**
 * Check if a specific order can be cancelled
 */
export async function cancelOrderPrechecks({
  infoClient,
  ethAddress,
  params,
}: {
  infoClient: hyperliquid.InfoClient;
  ethAddress: string;
  params: CancelOrderParams;
}): Promise<CancelOrderPrechecksResult> {
  try {
    const openOrders = await infoClient.openOrders({
      user: ethAddress as `0x${string}`,
    });

    const orderExists = openOrders.some((order) => order.oid === params.orderId);

    if (!orderExists) {
      return {
        success: false,
        reason: `Order ${params.orderId} not found or already filled/cancelled`,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check if there are open orders for a symbol that can be cancelled
 */
export async function cancelAllOrdersForSymbolPrechecks({
  infoClient,
  ethAddress,
  params,
}: {
  infoClient: hyperliquid.InfoClient;
  ethAddress: string;
  params: CancelAllOrdersForSymbolParams;
}): Promise<CancelAllOrdersForSymbolPrechecksResult> {
  try {
    const openOrders = await infoClient.openOrders({
      user: ethAddress as `0x${string}`,
    });

    const ordersForSymbol = openOrders.filter((order) => order.coin === params.symbol);

    if (ordersForSymbol.length === 0) {
      return {
        success: false,
        reason: `No open orders found for ${params.symbol}`,
      };
    }

    return {
      success: true,
      orderCount: ordersForSymbol.length,
    };
  } catch (error) {
    return {
      success: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
