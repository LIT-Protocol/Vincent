import * as hyperliquid from '@nktkas/hyperliquid';
import { SymbolConverter } from '@nktkas/hyperliquid/utils';

export interface SpotTradeParams {
  symbol: string;
  price: string;
  size: string;
}

/**
 * Check if spot trade can be executed
 */
export async function spotTradePrechecks(
  transport: hyperliquid.HttpTransport,
  userAddress: string,
  params: SpotTradeParams,
): Promise<{ success: boolean; reason?: string; assetId?: number }> {
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
      await infoClient.clearinghouseState({ user: userAddress as `0x${string}` });
      // If this succeeds, account exists
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('does not exist')) {
        return {
          success: false,
          reason: 'Hyperliquid account does not exist. Please deposit first.',
          assetId,
        };
      }
      throw error;
    }

    // Check spot balance to ensure user has funds
    const spotState = await infoClient.spotClearinghouseState({
      user: userAddress as `0x${string}`,
    });

    if (!spotState.balances || spotState.balances.length === 0) {
      return {
        success: false,
        reason: 'No spot balance found. Please transfer funds to spot account first.',
        assetId,
      };
    }

    return {
      success: true,
      assetId,
    };
  } catch (error) {
    return {
      success: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
