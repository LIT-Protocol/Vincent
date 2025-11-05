import * as hyperliquid from '@nktkas/hyperliquid';
import { SymbolConverter } from '@nktkas/hyperliquid/utils';
import { OrderRequest, UpdateLeverageRequest, parser } from '@nktkas/hyperliquid/api/exchange';
import { signL1Action } from '@nktkas/hyperliquid/signing';
import { bigIntReplacer } from '@lit-protocol/vincent-ability-sdk';

import { LitActionPkpEthersWallet } from './lit-action-pkp-ethers-wallet';

export type TimeInForce = 'Gtc' | 'Ioc' | 'Alo';

export interface PerpTradeParams {
  symbol: string;
  price: string;
  size: string;
  isLong: boolean; // true for long, false for short
  /**
   * Order type configuration.
   * - For limit orders: specify { type: 'limit', tif: 'Gtc' | 'Ioc' | 'Alo' }
   * - For market orders: specify { type: 'market' }
   * @default { type: 'limit', tif: 'Gtc' }
   */
  orderType?: { type: 'limit'; tif: TimeInForce } | { type: 'market' };
  /**
   * Leverage configuration.
   * @default { leverage: 2, isCross: true }
   */
  leverage?: {
    leverage: number; // 1-50x
    isCross: boolean; // true for cross margin, false for isolated
  };
}

/**
 * Execute a perpetual trade on Hyperliquid
 */
export async function executePerpOrder({
  transport,
  pkpPublicKey,
  params,
  useTestnet = false,
}: {
  transport: hyperliquid.HttpTransport;
  pkpPublicKey: string;
  params: PerpTradeParams;
  useTestnet?: boolean;
}) {
  // Get converter for symbol to asset ID
  const converter = await SymbolConverter.create({ transport });
  const assetId = converter.getAssetId(params.symbol);

  if (assetId === undefined) {
    throw new Error(
      `Failed to get asset ID for ${params.symbol}. The perpetual contract may not exist.`,
    );
  }

  // Create PKP wallet
  const pkpWallet = new LitActionPkpEthersWallet(pkpPublicKey);
  const pkpAddress = await pkpWallet.getAddress();

  // Set leverage if specified
  if (params.leverage) {
    const leverageNonceResponse = await Lit.Actions.runOnce(
      { waitForResponse: true, name: 'HyperLiquidPerpLeverageNonce' },
      async () => {
        return Date.now().toString();
      },
    );
    const leverageNonce = parseInt(leverageNonceResponse);

    const updateLeverageAction = parser(UpdateLeverageRequest.entries.action)({
      type: 'updateLeverage',
      asset: assetId,
      isCross: params.leverage.isCross,
      leverage: params.leverage.leverage,
    });

    const leverageSignature = await signL1Action({
      wallet: pkpWallet,
      action: updateLeverageAction,
      nonce: leverageNonce,
      isTestnet: useTestnet,
    });

    await Lit.Actions.runOnce(
      { waitForResponse: true, name: 'HyperLiquidPerpLeverageRequest' },
      async () => {
        return JSON.stringify(
          await transport.request('exchange', {
            action: updateLeverageAction,
            signature: leverageSignature,
            nonce: leverageNonce,
          }),
        );
      },
    );

    console.log(
      `[executePerpOrder] Set leverage to ${params.leverage.leverage}x (${params.leverage.isCross ? 'cross' : 'isolated'})`,
    );
  }

  // Generate deterministic nonce for order in runOnce
  const nonceResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'HyperLiquidPerpOrderNonce' },
    async () => {
      return Date.now().toString();
    },
  );
  const nonce = parseInt(nonceResponse);

  // Determine order type configuration
  const orderType = params.orderType || { type: 'limit', tif: 'Gtc' };

  // Construct order type field based on orderType
  const orderTypeField =
    orderType.type === 'market'
      ? { limit: { tif: 'FrontendMarket' } }
      : { limit: { tif: orderType.tif } };

  // Construct order action
  const orderAction = parser(OrderRequest.entries.action)({
    type: 'order',
    orders: [
      {
        a: assetId,
        b: params.isLong, // true for long (buy), false for short (sell)
        p: params.price,
        s: params.size,
        r: false, // reduce only (false for opening positions)
        t: orderTypeField,
      },
    ],
    grouping: 'na',
  });

  // Sign and send
  const signature = await signL1Action({
    wallet: pkpWallet,
    action: orderAction,
    nonce,
    isTestnet: useTestnet,
  });

  const orderResult = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'HyperLiquidPerpOrderRequest' },
    async () => {
      return JSON.stringify(
        {
          result: await transport.request('exchange', {
            action: orderAction,
            signature,
            nonce,
          }),
        },
        bigIntReplacer,
        2,
      );
    },
  );

  const parsedOrderResult = JSON.parse(orderResult);
  console.log('[executePerpOrder] Order result', parsedOrderResult);

  const perpOrderStatus = parsedOrderResult.result.response.data.statuses[0];

  if (perpOrderStatus.error !== undefined) {
    return {
      status: 'error',
      error: perpOrderStatus.error,
    };
  }

  return {
    status: 'success',
    orderResult: parsedOrderResult.result as Record<string, unknown>,
  };
}
