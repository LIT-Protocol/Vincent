import * as hyperliquid from '@nktkas/hyperliquid';
import { SymbolConverter } from '@nktkas/hyperliquid/utils';
import { CancelRequest, CancelResponse, parser } from '@nktkas/hyperliquid/api/exchange';
import { signL1Action } from '@nktkas/hyperliquid/signing';

import { LitActionPkpEthersWallet } from '../lit-action-pkp-ethers-wallet';

export type CancelAllOrdersResult = CancelAllOrdersResultSuccess | CancelAllOrdersResultFailure;

export interface CancelAllOrdersResultSuccess {
  status: 'success';
  cancelResult: CancelResponse;
}

export interface CancelAllOrdersResultFailure {
  status: 'error';
  reason: string;
}

/**
 * Cancel all open spot orders for a specific symbol
 */
export async function cancelAllOrdersForSymbol({
  transport,
  pkpPublicKey,
  symbol,
  useTestnet = false,
}: {
  transport: hyperliquid.HttpTransport;
  pkpPublicKey: string;
  symbol: string;
  useTestnet?: boolean;
}): Promise<CancelAllOrdersResult> {
  // Get converter for symbol to asset ID
  const converter = await SymbolConverter.create({ transport });
  const assetId = converter.getAssetId(symbol);

  if (assetId === undefined) {
    throw new Error(`Failed to get asset ID for ${symbol}. The trading pair may not exist.`);
  }

  // Create PKP wallet
  const pkpWallet = new LitActionPkpEthersWallet(pkpPublicKey);
  const pkpAddress = await pkpWallet.getAddress();

  // Get all open orders for this user
  const infoClient = new hyperliquid.InfoClient({ transport });
  const openOrders = await infoClient.openOrders({
    user: pkpAddress as `0x${string}`,
  });

  // Filter orders for the specific symbol/asset
  const ordersToCancel = openOrders
    .filter((order) => order.coin === symbol)
    .map((order) => ({
      a: assetId,
      o: order.oid,
    }));

  if (ordersToCancel.length === 0) {
    return {
      status: 'error',
      reason: 'No open orders to cancel',
    };
  }

  // Generate deterministic nonce in runOnce
  const nonceResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'HyperLiquidCancelAllOrdersNonce' },
    async () => {
      return Date.now().toString();
    },
  );
  const nonce = parseInt(nonceResponse);

  // Construct cancel action for all orders
  const cancelAction = parser(CancelRequest.entries.action)({
    type: 'cancel',
    cancels: ordersToCancel,
  });

  // Sign and send
  const signature = await signL1Action({
    wallet: pkpWallet,
    action: cancelAction,
    nonce,
    isTestnet: useTestnet,
  });

  const cancelResult = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'HyperLiquidCancelAllOrdersRequest' },
    async () => {
      return JSON.stringify(
        await transport.request('exchange', {
          action: cancelAction,
          signature,
          nonce,
        }),
      );
    },
  );

  const parsedCancelResult = JSON.parse(cancelResult);
  console.log('[cancelAllSpotOrders] Cancel result', parsedCancelResult);

  return {
    status: 'success',
    cancelResult: parsedCancelResult.result as CancelResponse,
  };
}
