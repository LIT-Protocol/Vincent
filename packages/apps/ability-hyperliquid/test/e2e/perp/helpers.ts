import * as hyperliquid from '@nktkas/hyperliquid';

// Helper function to round to N significant figures
function toSignificantFigures(num: number, sigFigs: number): string {
  if (num === 0) return '0';
  const magnitude = Math.floor(Math.log10(Math.abs(num)));
  const scale = Math.pow(10, sigFigs - magnitude - 1);
  const rounded = Math.round(num * scale) / scale;
  return rounded.toString();
}

export interface CalculatePerpOrderParamsInput {
  transport: hyperliquid.HttpTransport;
  infoClient: hyperliquid.InfoClient;
  symbol: string; // Perp symbol e.g., "ETH" (base asset only)
  usdNotional: string; // Notional value in USD
  isLong: boolean;
  priceMultiplier?: number; // e.g., 1.01 for long (1% above mid), 0.99 for short (1% below mid)
}

export interface PerpOrderParams {
  price: string;
  size: string;
  midPrice: string;
  assetMeta: {
    name: string;
    szDecimals: number;
  };
}

/**
 * Calculate price and size for a perpetual order according to Hyperliquid rules:
 * - Max 5 significant figures for price
 * - No more than (MAX_DECIMALS - szDecimals) decimal places for price
 * - Size rounded to szDecimals
 * - For perps: MAX_DECIMALS = 6 (vs 8 for spot)
 */
export async function calculatePerpOrderParams({
  transport,
  infoClient,
  symbol,
  usdNotional,
  isLong,
  priceMultiplier = isLong ? 1.01 : 0.99,
}: CalculatePerpOrderParamsInput): Promise<PerpOrderParams> {
  // Get asset metadata using base symbol to determine szDecimals
  const meta = await infoClient.meta();
  const assetMeta = meta.universe.find((u) => u.name === symbol);
  if (!assetMeta) {
    console.log(
      '[calculatePerpOrderParams] Available assets:',
      meta.universe.map((u) => u.name),
    );
    throw new Error(`Unable to find metadata for asset ${symbol}`);
  }

  console.log(`[calculatePerpOrderParams] Asset metadata:`, {
    name: assetMeta.name,
    szDecimals: assetMeta.szDecimals,
  });

  // Get mid price using the symbol name directly
  // For perps, allMids uses the symbol name as the key (e.g., "ETH", "SOL")
  const allMidPrices = await infoClient.allMids();
  const midPrice = allMidPrices[symbol];

  if (!midPrice) {
    console.log(
      '[calculatePerpOrderParams] Available price keys (first 20):',
      Object.keys(allMidPrices).slice(0, 20),
    );
    throw new Error(`Unable to get mid price for ${symbol}`);
  }

  console.log(`[calculatePerpOrderParams] Mid price for ${symbol}: ${midPrice}`);

  // Calculate price according to Hyperliquid rules:
  // Max 5 significant figures, no more than (MAX_DECIMALS - szDecimals) decimal places
  // For perps, MAX_DECIMALS = 6
  const MAX_DECIMALS = 6;
  const maxPriceDecimals = MAX_DECIMALS - assetMeta.szDecimals;
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

  // Calculate size for perp: size = USD notional / price
  const rawSize = parseFloat(usdNotional) / parseFloat(price);
  const multiplier = Math.pow(10, assetMeta.szDecimals);
  const minSize = 1 / multiplier; // Minimum size is 10^(-szDecimals)

  // Use different rounding for long vs short:
  // - Long: floor to avoid spending MORE than intended USD notional
  // - Short: ceil to ensure order value meets minimum
  const roundingFn = isLong ? Math.floor : Math.ceil;
  let size = Math.max(minSize, roundingFn(rawSize * multiplier) / multiplier).toFixed(
    assetMeta.szDecimals,
  );
  // Remove trailing zeros from size
  size = parseFloat(size).toString();

  console.log(`[calculatePerpOrderParams] Calculated - Price: ${price}, Size: ${size}`);

  return {
    price,
    size,
    midPrice,
    assetMeta: {
      name: assetMeta.name,
      szDecimals: assetMeta.szDecimals,
    },
  };
}
