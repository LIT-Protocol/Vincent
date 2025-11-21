import * as hyperliquid from '@nktkas/hyperliquid';
import { SymbolConverter } from '@nktkas/hyperliquid/utils';
import { OrderRequest, OrderResponse, parser } from '@nktkas/hyperliquid/api/exchange';
import { signL1Action } from '@nktkas/hyperliquid/signing';
import { bigIntReplacer } from '@lit-protocol/vincent-ability-sdk';

import { LitActionPkpEthersWallet } from './lit-action-pkp-ethers-wallet';
import { getHyperliquidNonce } from './get-hyperliquid-nonce';

export type TimeInForce = 'Gtc' | 'Ioc' | 'Alo';

export interface SpotTradeParams {
  symbol: string;
  price: string;
  size: string;
  isBuy: boolean; // true for buy, false for sell
  /**
   * Order type configuration.
   * - For limit orders: specify { type: 'limit', tif: 'Gtc' | 'Ioc' | 'Alo' }
   * - For market orders: specify { type: 'market' }
   * @default { type: 'limit', tif: 'Gtc' }
   */
  orderType?: { type: 'limit'; tif: TimeInForce } | { type: 'market' };
  /**
   * Builder fee configuration.
   * Only applies to sell orders (builder codes do not apply to buying side of spot trades).
   * Fee is specified in tenths of basis points (e.g., 50 = 0.05% = 5 basis points).
   * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#builder-codes
   */
  builderFee?: {
    builderAddress: string; // Builder address
    feeInTenthsOfBps: number; // Fee in tenths of basis points (e.g., 50 = 0.05%)
  };
}

export type SpotOrderResult = SpotOrderResultSuccess | SpotOrderResultFailure;

export interface SpotOrderResultSuccess {
  status: 'success';
  orderResult: OrderResponse;
}

export interface SpotOrderResultFailure {
  status: 'error';
  error: string;
}

/**
 * Execute a spot trade on Hyperliquid
 */
export async function executeSpotOrder({
  transport,
  pkpPublicKey,
  params,
  useTestnet = false,
}: {
  transport: hyperliquid.HttpTransport;
  pkpPublicKey: string;
  params: SpotTradeParams;
  useTestnet?: boolean;
}): Promise<SpotOrderResult> {
  // Get converter for symbol to asset ID
  const converter = await SymbolConverter.create({ transport });
  const assetId = converter.getAssetId(params.symbol);

  if (assetId === undefined) {
    throw new Error(`Failed to get asset ID for ${params.symbol}. The trading pair may not exist.`);
  }

  // Create PKP wallet
  const pkpWallet = new LitActionPkpEthersWallet(pkpPublicKey);
  const nonce = await getHyperliquidNonce();

  // Determine order type configuration
  const orderType = params.orderType || { type: 'limit', tif: 'Gtc' };

  // Construct order type field based on orderType
  const orderTypeField =
    orderType.type === 'market'
      ? { limit: { tif: 'FrontendMarket' } }
      : { limit: { tif: orderType.tif } };

  // Construct order action
  // Note: Builder codes only apply to sell orders (not buy orders) for spot trades
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
        b: params.isBuy, // true for buy, false for sell
        p: params.price,
        s: params.size,
        r: false, // reduce only (false for spot)
        t: orderTypeField,
      },
    ],
    grouping: 'na',
  };

  // Add builder fee if provided and this is a sell order
  // Builder codes do not apply to the buying side of spot trades
  if (params.builderFee && !params.isBuy) {
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
    { waitForResponse: true, name: 'HyperLiquidSpotOrderRequest' },
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
  console.log('[executeSpotTrade] Order result', parsedOrderResult);

  const spotOrderStatus = parsedOrderResult.result.response.data.statuses[0];

  if (spotOrderStatus.error !== undefined) {
    return {
      status: 'error',
      error: spotOrderStatus.error,
    };
  }

  return {
    status: 'success',
    orderResult: parsedOrderResult.result as OrderResponse,
  };
}
