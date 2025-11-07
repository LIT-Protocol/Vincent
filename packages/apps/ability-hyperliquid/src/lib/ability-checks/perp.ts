import { ethers } from 'ethers';
import * as hyperliquid from '@nktkas/hyperliquid';
import { SymbolConverter } from '@nktkas/hyperliquid/utils';

export type PerpTradePrechecksResult =
  | PerpTradePrechecksResultSuccess
  | PerpTradePrechecksResultFailure;

export interface PerpTradePrechecksResultSuccess {
  success: true;
  availableMargin: string;
}

export interface PerpTradePrechecksResultFailure {
  success: false;
  reason: string;
  availableMargin?: string;
}

export interface PerpTradeParams {
  symbol: string;
}

/**
 * Check if perpetual trade can be executed
 */
export async function perpTradePrechecks({
  transport,
  ethAddress,
  params,
}: {
  transport: hyperliquid.HttpTransport;
  ethAddress: string;
  params: PerpTradeParams;
}): Promise<PerpTradePrechecksResult> {
  const converter = await SymbolConverter.create({ transport });
  const assetId = converter.getAssetId(params.symbol);

  if (assetId === undefined) {
    return {
      success: false,
      reason: `Perpetual contract ${params.symbol} does not exist`,
    };
  }

  // Check perp balance to ensure user has funds
  const infoClient = new hyperliquid.InfoClient({ transport });
  const perpState = await infoClient.clearinghouseState({
    user: ethAddress,
  });

  // Check if user has any cross margin value or margin summary
  if (!perpState.crossMarginSummary) {
    return {
      success: false,
      reason: 'No perp account found. Please transfer funds to perp account first.',
    };
  }

  // Check if user has available margin
  // accountValue is in USDC with 6 decimals
  const availableMarginBN = ethers.utils.parseUnits(perpState.crossMarginSummary.accountValue, 6);

  if (availableMarginBN.lte(0)) {
    return {
      success: false,
      reason: 'Insufficient perp account balance. Please transfer funds to perp account first.',
      availableMargin: '0',
    };
  }

  return {
    success: true,
    availableMargin: perpState.crossMarginSummary.accountValue,
  };
}
