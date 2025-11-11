import * as hyperliquid from '@nktkas/hyperliquid';
import { SymbolConverter } from '@nktkas/hyperliquid/utils';
import { CancelRequest, CancelResponse, parser } from '@nktkas/hyperliquid/api/exchange';
import { signL1Action } from '@nktkas/hyperliquid/signing';
import { bigIntReplacer } from '@lit-protocol/vincent-ability-sdk';

import { LitActionPkpEthersWallet } from '../lit-action-pkp-ethers-wallet';
import { getHyperliquidNonce } from '../get-hyperliquid-nonce';

export interface CancelSpotOrderParams {
  symbol: string; // e.g., "PURR/USDC"
  orderId: number; // Order ID to cancel
}

export type CancelOrderResult = CancelOrderResultSuccess | CancelOrderResultFailure;

export interface CancelOrderResultSuccess {
  status: 'success';
  cancelResult: CancelResponse;
}

export interface CancelOrderResultFailure {
  status: 'error';
  reason: string;
}

/**
 * Cancel a specific spot order on Hyperliquid
 */
export async function cancelOrder({
  transport,
  pkpPublicKey,
  params,
  useTestnet = false,
}: {
  transport: hyperliquid.HttpTransport;
  pkpPublicKey: string;
  params: CancelSpotOrderParams;
  useTestnet?: boolean;
}): Promise<CancelOrderResult> {
  // Get converter for symbol to asset ID
  const converter = await SymbolConverter.create({ transport });
  const assetId = converter.getAssetId(params.symbol);

  if (assetId === undefined) {
    throw new Error(`Failed to get asset ID for ${params.symbol}. The trading pair may not exist.`);
  }

  // Create PKP wallet
  const pkpWallet = new LitActionPkpEthersWallet(pkpPublicKey);
  const nonce = await getHyperliquidNonce();

  // Construct cancel action
  const cancelAction = parser(CancelRequest.entries.action)({
    type: 'cancel',
    cancels: [
      {
        a: assetId,
        o: params.orderId,
      },
    ],
  });

  // Sign and send
  const signature = await signL1Action({
    wallet: pkpWallet,
    action: cancelAction,
    nonce,
    isTestnet: useTestnet,
  });

  const cancelResult = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'HyperLiquidCancelOrderRequest' },
    async () => {
      return JSON.stringify(
        {
          result: await transport.request('exchange', {
            action: cancelAction,
            signature,
            nonce,
          }),
        },
        bigIntReplacer,
        2,
      );
    },
  );

  const parsedCancelResult = JSON.parse(cancelResult);
  console.log('[cancelSpotOrder] Cancel result', parsedCancelResult);

  const cancelStatus = parsedCancelResult.result.response.data.statuses[0];

  if (typeof cancelStatus === 'object' && cancelStatus.error !== undefined) {
    return {
      status: 'error',
      reason: cancelStatus.error,
    };
  }

  return {
    status: 'success',
    cancelResult: parsedCancelResult.result as CancelResponse,
  };
}
