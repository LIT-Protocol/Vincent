import * as hyperliquid from '@nktkas/hyperliquid';
import { SymbolConverter } from '@nktkas/hyperliquid/utils';

export interface PerpTradeParams {
  symbol: string;
  price: string;
  size: string;
}

/**
 * Check if perpetual trade can be executed
 */
export async function perpTradePrechecks(
  transport: hyperliquid.HttpTransport,
  userAddress: string,
  params: PerpTradeParams,
): Promise<{ success: boolean; reason?: string; assetId?: number }> {
  try {
    const converter = await SymbolConverter.create({ transport });
    const assetId = converter.getAssetId(params.symbol);

    if (assetId === undefined) {
      return {
        success: false,
        reason: `Perpetual contract ${params.symbol} does not exist`,
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

    // Check perp balance to ensure user has funds
    const perpState = await infoClient.clearinghouseState({
      user: userAddress as `0x${string}`,
    });

    // Check if user has any cross margin value or margin summary
    if (!perpState.crossMarginSummary) {
      return {
        success: false,
        reason: 'No perp account found. Please transfer funds to perp account first.',
        assetId,
      };
    }

    const accountValue = parseFloat(perpState.crossMarginSummary.accountValue);
    if (accountValue <= 0) {
      return {
        success: false,
        reason: 'Insufficient perp account balance. Please transfer funds to perp account first.',
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
