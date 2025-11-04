import * as hyperliquid from '@nktkas/hyperliquid';
import {
  UsdClassTransferRequest,
  UsdClassTransferTypes,
  parser,
} from '@nktkas/hyperliquid/api/exchange';
import { signUserSignedAction } from '@nktkas/hyperliquid/signing';
import { ethers } from 'ethers';
import { bigIntReplacer } from '@lit-protocol/vincent-ability-sdk';

import { LitActionPkpEthersWallet } from './lit-action-pkp-ethers-wallet';

/**
 * Transfer deposited funds to spot trading account on Hyperliquid
 */
export async function transferToSpot({
  transport,
  pkpPublicKey,
  amount,
}: {
  transport: hyperliquid.HttpTransport;
  pkpPublicKey: string;
  amount: string;
}) {
  // Generate deterministic nonce in runOnce
  // This ensures all nodes use the same nonce and produce the same hash
  const nonceResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'HyperLiquidTransferToSpotNonce' },
    async () => {
      return Date.now().toString();
    },
  );
  const nonce = parseInt(nonceResponse);

  const transferAction = parser(UsdClassTransferRequest.entries.action)({
    type: 'usdClassTransfer',
    // Convert amount from raw units (e.g., "6000000" for 6.0 USDC) to formatted string (e.g., "6.0")
    // Hyperliquid expects the amount as a string in human-readable format
    amount: ethers.utils.formatUnits(amount, 6),
    signatureChainId: '0xa4b1', // Arbitrum mainnet chain ID: 42161
    hyperliquidChain: 'Mainnet',
    // false means transfer to spot, true means transfer to perp
    toPerp: false,
    nonce,
  });

  // Sign using user-signed action (NOT L1 action!)
  // UsdClassTransfer is a user-signed action that uses EIP-712 typed data
  const pkpEthersWallet = new LitActionPkpEthersWallet(pkpPublicKey);
  const signature = await signUserSignedAction({
    wallet: pkpEthersWallet,
    action: transferAction,
    types: UsdClassTransferTypes,
  });

  const transferResult = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'HyperLiquidTransferToSpotRequest' },
    async () => {
      return JSON.stringify(
        {
          result: await transport.request('exchange', {
            action: transferAction,
            signature,
            nonce,
          }),
        },
        bigIntReplacer,
        2,
      );
    },
  );

  const parsedTransferResult = JSON.parse(transferResult);
  return {
    transferResult: parsedTransferResult.result as Record<string, unknown>,
  };
}
