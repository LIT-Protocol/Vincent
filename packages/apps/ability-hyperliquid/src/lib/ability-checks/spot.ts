import * as hyperliquid from '@nktkas/hyperliquid';
import { SymbolConverter } from '@nktkas/hyperliquid/utils';

export type SpotTradePrechecksResult =
  | SpotTradePrechecksResultSuccess
  | SpotTradePrechecksResultFailure;

export interface SpotTradePrechecksResultSuccess {
  success: true;
}

export interface SpotTradePrechecksResultFailure {
  success: false;
  reason: string;
}

export interface SpotTradeParams {
  symbol: string;
  price: string;
  size: string;
  isBuy: boolean;
}

/**
 * Check if spot trade can be executed
 */
export async function spotTradePrechecks({
  transport,
  ethAddress,
  params,
}: {
  transport: hyperliquid.HttpTransport;
  ethAddress: string;
  params: SpotTradeParams;
}): Promise<SpotTradePrechecksResult> {
  try {
    const converter = await SymbolConverter.create({ transport });
    const assetId = converter.getAssetId(params.symbol);

    if (assetId === undefined) {
      return {
        success: false,
        reason: `Trading pair ${params.symbol} does not exist`,
      };
    }

    // Check if account exists
    const infoClient = new hyperliquid.InfoClient({ transport });
    try {
      await infoClient.clearinghouseState({ user: ethAddress });
      // If this succeeds, account exists
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('does not exist')) {
        return {
          success: false,
          reason: 'Hyperliquid account does not exist. Please deposit first.',
        };
      }
      throw error;
    }

    // Check spot balance to ensure user has funds
    const spotState = await infoClient.spotClearinghouseState({
      user: ethAddress,
    });

    if (!spotState.balances || spotState.balances.length === 0) {
      return {
        success: false,
        reason: 'No spot balance found. Please transfer funds to spot account first.',
      };
    }

    // Parse the trading pair to get base and quote assets
    // Format examples: "BTC/USDC", "ETH/USDC", "BTC/ETH"
    // Note: Format validation is handled by spotTradeParamsSchema in schemas.ts
    const [baseAsset, quoteAsset] = params.symbol.split('/');

    // Check balance based on whether this is a buy or sell
    if (params.isBuy) {
      // For buy orders, check if user has the quote asset (what they're spending)
      const quoteBalance = spotState.balances.find((b) => b.coin === quoteAsset);
      if (!quoteBalance) {
        return {
          success: false,
          reason: `No ${quoteAsset} balance found in spot account. Cannot buy ${baseAsset}.`,
        };
      }

      // Check if quote balance is available (not all locked in orders)
      const availableQuote = parseFloat(quoteBalance.total) - parseFloat(quoteBalance.hold);
      if (availableQuote <= 0) {
        return {
          success: false,
          reason: `Insufficient available ${quoteAsset} balance. All ${quoteAsset} is locked in open orders.`,
        };
      }
    } else {
      // For sell orders, check if user has the base asset (what they're selling)
      const baseBalance = spotState.balances.find((b) => b.coin === baseAsset);
      if (!baseBalance) {
        return {
          success: false,
          reason: `No ${baseAsset} balance found in spot account. Cannot sell ${baseAsset}.`,
        };
      }

      // Check if base balance is available (not all locked in orders)
      const availableBase = parseFloat(baseBalance.total) - parseFloat(baseBalance.hold);
      if (availableBase <= 0) {
        return {
          success: false,
          reason: `Insufficient available ${baseAsset} balance. All ${baseAsset} is locked in open orders.`,
        };
      }
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
