import * as hyperliquid from '@nktkas/hyperliquid';
import { SymbolConverter } from '@nktkas/hyperliquid/utils';

// Helper function to round to N significant figures
function toSignificantFigures(num: number, sigFigs: number): string {
  if (num === 0) return '0';
  const magnitude = Math.floor(Math.log10(Math.abs(num)));
  const scale = Math.pow(10, sigFigs - magnitude - 1);
  const rounded = Math.round(num * scale) / scale;
  return rounded.toString();
}

export interface CalculateSpotOrderParamsInput {
  transport: hyperliquid.HttpTransport;
  infoClient: hyperliquid.InfoClient;
  tradingPair: string;
  tokenName: string;
  usdcAmount: string;
  isBuy: boolean;
  priceMultiplier?: number; // e.g., 1.01 for buy (1% above mid), 0.99 for sell (1% below mid)
  maxAvailableBalance?: string; // Optional: max available balance for sell orders
}

export interface SpotOrderParams {
  price: string;
  size: string;
  midPrice: string;
  tokenMeta: {
    name: string;
    szDecimals: number;
  };
}

/**
 * Calculate price and size for a spot order according to Hyperliquid rules:
 * - Max 5 significant figures for price
 * - No more than (MAX_DECIMALS - szDecimals) decimal places for price
 * - Size rounded to szDecimals
 */
export async function calculateSpotOrderParams({
  transport,
  infoClient,
  tradingPair,
  tokenName,
  usdcAmount,
  isBuy,
  priceMultiplier = isBuy ? 1.01 : 0.99,
  maxAvailableBalance,
}: CalculateSpotOrderParamsInput): Promise<SpotOrderParams> {
  // Get spot pair ID
  const converter = await SymbolConverter.create({ transport });
  const spotPairId = converter.getSpotPairId(tradingPair);
  if (!spotPairId) {
    throw new Error(`Unable to get spot pair ID for ${tradingPair}`);
  }

  // Get token metadata to determine szDecimals
  const spotMeta = await infoClient.spotMeta();
  const tokenMeta = spotMeta.tokens.find((t) => t.name === tokenName);
  if (!tokenMeta) {
    throw new Error(`Unable to find metadata for token ${tokenName}`);
  }

  // Get mid price
  const allMidPrices = await infoClient.allMids();
  const midPrice = allMidPrices[spotPairId];

  // Calculate price according to Hyperliquid rules:
  // Max 5 significant figures, no more than (MAX_DECIMALS - szDecimals) decimal places
  // For spot, MAX_DECIMALS = 8
  const MAX_DECIMALS = 8;
  const maxPriceDecimals = MAX_DECIMALS - tokenMeta.szDecimals;
  const priceRaw = parseFloat(midPrice) * priceMultiplier;

  // First apply significant figures limit (max 5)
  let price = toSignificantFigures(priceRaw, 5);

  // Then check decimal places constraint
  const [, decimalPart] = price.split('.');
  if (decimalPart && decimalPart.length > maxPriceDecimals) {
    // Need to round to maxPriceDecimals
    price = parseFloat(price).toFixed(maxPriceDecimals);
    // Remove trailing zeros
    price = parseFloat(price).toString();
  }

  // Calculate size rounded to szDecimals
  const rawSize = parseFloat(usdcAmount) / parseFloat(price);
  const multiplier = Math.pow(10, tokenMeta.szDecimals);
  const minSize = 1 / multiplier; // Minimum size is 10^(-szDecimals)

  // Use floor to avoid over-spending (buy) or over-selling (sell)
  let size = Math.floor(rawSize * multiplier) / multiplier;

  // Ensure size meets minimum requirement
  size = Math.max(minSize, size);

  // For sell orders, cap at available balance if provided
  if (!isBuy && maxAvailableBalance) {
    const maxBalance = parseFloat(maxAvailableBalance);
    // Floor the available balance to avoid trying to sell fractional dust
    const flooredMaxBalance = Math.floor(maxBalance * multiplier) / multiplier;
    size = Math.min(size, flooredMaxBalance);
  }

  // Final size formatting
  size = size.toFixed(tokenMeta.szDecimals);
  // Remove trailing zeros from size
  size = parseFloat(size).toString();

  console.log(
    `[calculateSpotOrderParams] ${isBuy ? 'Buy' : 'Sell'} calculation:`,
    `rawSize=${rawSize.toFixed(6)}, finalSize=${size}, maxBalance=${maxAvailableBalance || 'N/A'}`,
  );

  return {
    price,
    size,
    midPrice,
    tokenMeta: {
      name: tokenMeta.name,
      szDecimals: tokenMeta.szDecimals,
    },
  };
}
