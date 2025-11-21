import * as hyperliquid from '@nktkas/hyperliquid';
import { SymbolConverter } from '@nktkas/hyperliquid/utils';
import {
  OrderRequest,
  OrderResponse,
  UpdateLeverageRequest,
  parser,
} from '@nktkas/hyperliquid/api/exchange';
import { signL1Action } from '@nktkas/hyperliquid/signing';
import { bigIntReplacer } from '@lit-protocol/vincent-ability-sdk';

import { LitActionPkpEthersWallet } from './lit-action-pkp-ethers-wallet';
import { getHyperliquidNonce } from './get-hyperliquid-nonce';

export type TimeInForce = 'Gtc' | 'Ioc' | 'Alo';

export interface PerpTradeParams {
  symbol: string;
  price: string;
  size: string;
  isLong: boolean; // true for long, false for short
  /**
   * Reduce-only flag. If true, order will only reduce existing position.
   * Use this to close positions - the order will only fill up to the position size.
   * @default false
   */
  reduceOnly?: boolean;
  /**
   * Order type configuration.
   * - For limit orders: specify { type: 'limit', tif: 'Gtc' | 'Ioc' | 'Alo' }
   * - For market orders: specify { type: 'market' }
   * @default { type: 'limit', tif: 'Gtc' }
   */
  orderType?: { type: 'limit'; tif: TimeInForce } | { type: 'market' };
  /**
   * Leverage configuration.
   * Required parameter - must specify leverage (1-10x) and margin type.
   */
  leverage: {
    leverage: number; // 1-10x
    isCross: boolean; // true for cross margin, false for isolated
  };
  /**
   * Builder fee configuration.
   * Applies to both long and short orders for perpetuals.
   * Fee is specified in tenths of basis points (e.g., 10 = 0.01% = 1 basis point).
   * Maximum builder fee is 0.1% (100 tenths of basis points) for perps.
   * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#builder-codes
   */
  builderFee?: {
    builderAddress: string; // Builder address
    feeInTenthsOfBps: number; // Fee in tenths of basis points (e.g., 10 = 0.01%)
  };
}

export type PerpOrderResult = PerpOrderResultSuccess | PerpOrderResultFailure;

export interface PerpOrderResultSuccess {
  status: 'success';
  orderResult: OrderResponse;
}

export interface PerpOrderResultFailure {
  status: 'error';
  error: string;
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
}): Promise<PerpOrderResult> {
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

  const nonce = await getHyperliquidNonce();

  // Determine order type configuration
  const orderType = params.orderType || { type: 'limit', tif: 'Gtc' };

  // Construct order type field based on orderType
  const orderTypeField =
    orderType.type === 'market'
      ? { limit: { tif: 'FrontendMarket' } }
      : { limit: { tif: orderType.tif } };

  // Construct order action
  const orderActionParams: {
    type: 'order';
    orders: Array<{
      a: number;
      b: boolean;
      p: string;
      s: string;
      r: boolean;
      t: typeof orderTypeField;
    }>;
    grouping: 'na';
    builder?: {
      b: `0x${string}`;
      f: number;
    };
  } = {
    type: 'order',
    orders: [
      {
        a: assetId,
        b: params.isLong, // true for long (buy), false for short (sell)
        p: params.price,
        s: params.size,
        r: params.reduceOnly ?? false, // reduce only (true to close positions, false for opening)
        t: orderTypeField,
      },
    ],
    grouping: 'na',
  };

  // Add builder fee if provided
  // Builder codes apply to both long and short orders for perpetuals
  if (params.builderFee) {
    orderActionParams.builder = {
      b: params.builderFee.builderAddress as `0x${string}`,
      f: params.builderFee.feeInTenthsOfBps,
    };
  }

  const orderAction = parser(OrderRequest.entries.action)(orderActionParams);

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
    orderResult: parsedOrderResult.result as OrderResponse,
  };
}
