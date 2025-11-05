import * as hyperliquid from '@nktkas/hyperliquid';
import { SymbolConverter } from '@nktkas/hyperliquid/utils';
import { CancelRequest, parser } from '@nktkas/hyperliquid/api/exchange';
import { signL1Action } from '@nktkas/hyperliquid/signing';
import { bigIntReplacer } from '@lit-protocol/vincent-ability-sdk';

import { LitActionPkpEthersWallet } from '../lit-action-pkp-ethers-wallet';

export interface CancelSpotOrderParams {
  symbol: string; // e.g., "PURR/USDC"
  orderId: number; // Order ID to cancel
}

/**
 * Cancel a specific spot order on Hyperliquid
 */
export async function cancelSpotOrder({
  transport,
  pkpPublicKey,
  params,
  useTestnet = false,
}: {
  transport: hyperliquid.HttpTransport;
  pkpPublicKey: string;
  params: CancelSpotOrderParams;
  useTestnet?: boolean;
}) {
  // Get converter for symbol to asset ID
  const converter = await SymbolConverter.create({ transport });
  const assetId = converter.getAssetId(params.symbol);

  if (assetId === undefined) {
    throw new Error(`Failed to get asset ID for ${params.symbol}. The trading pair may not exist.`);
  }

  // Create PKP wallet
  const pkpWallet = new LitActionPkpEthersWallet(pkpPublicKey);

  // Generate deterministic nonce in runOnce
  const nonceResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'HyperLiquidCancelOrderNonce' },
    async () => {
      return Date.now().toString();
    },
  );
  const nonce = parseInt(nonceResponse);

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
    cancelResult: parsedCancelResult.result as Record<string, unknown>,
  };
}
