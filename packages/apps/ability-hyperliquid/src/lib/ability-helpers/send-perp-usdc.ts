import * as hyperliquid from '@nktkas/hyperliquid';
import {
  UsdSendRequest,
  UsdSendTypes,
  SuccessResponse,
  parser,
} from '@nktkas/hyperliquid/api/exchange';
import { signUserSignedAction } from '@nktkas/hyperliquid/signing';
import { ethers } from 'ethers';
import { bigIntReplacer } from '@lit-protocol/vincent-ability-sdk';

import { LitActionPkpEthersWallet } from './lit-action-pkp-ethers-wallet';
import { getHyperliquidNonce } from './get-hyperliquid-nonce';
import { getHyperliquidChainId, getHyperliquidChainName } from './get-hyperliquid-chain-id';

export type SendPerpUsdcResult = {
  sendResult: SuccessResponse;
};

/**
 * Send USDC from your perp account to another Hyperliquid perp account
 */
export async function sendPerpUsdc({
  transport,
  pkpPublicKey,
  destination,
  amount,
  useTestnet = false,
}: {
  transport: hyperliquid.HttpTransport;
  pkpPublicKey: string;
  destination: string;
  amount: string;
  useTestnet?: boolean;
}): Promise<SendPerpUsdcResult> {
  const pkpWallet = new LitActionPkpEthersWallet(pkpPublicKey);
  const nonce = await getHyperliquidNonce();

  // Construct send action
  // UsdSend uses standard 6 decimals for USDC (not Hyperliquid's 8 decimal precision)
  const sendAction = parser(UsdSendRequest.entries.action)({
    type: 'usdSend',
    signatureChainId: getHyperliquidChainId(useTestnet),
    hyperliquidChain: getHyperliquidChainName(useTestnet),
    destination,
    // Convert amount from micro-units (6 decimals) to human-readable format
    // e.g., "1000000" -> "1.0"
    amount: ethers.utils.formatUnits(amount, 6),
    time: nonce,
  });

  // UsdSend is a user-signed action that uses EIP-712 typed data
  const signature = await signUserSignedAction({
    wallet: pkpWallet,
    action: sendAction,
    types: UsdSendTypes,
  });

  const sendResult = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'HyperLiquidSendPerpUsdcRequest' },
    async () => {
      return JSON.stringify(
        {
          result: await transport.request('exchange', {
            action: sendAction,
            signature,
            nonce,
          }),
        },
        bigIntReplacer,
        2,
      );
    },
  );

  const parsedSendResult = JSON.parse(sendResult);
  return {
    sendResult: parsedSendResult.result as SuccessResponse,
  };
}
