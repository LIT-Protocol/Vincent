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
 * Transfer funds between spot and perpetuals accounts on Hyperliquid
 */
export async function transferUsdcTo({
  transport,
  pkpPublicKey,
  amount,
  to,
  useTestnet = false,
}: {
  transport: hyperliquid.HttpTransport;
  pkpPublicKey: string;
  amount: string;
  to: 'spot' | 'perp';
  useTestnet?: boolean;
}) {
  if (to !== 'spot' && to !== 'perp') {
    throw new Error(
      '[transferUsdcTo] Invalid transfer destination. Must be either "spot" or "perp".',
    );
  }

  // Generate deterministic nonce in runOnce
  // This ensures all nodes use the same nonce and produce the same hash
  const nonceResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'HyperLiquidTransferNonce' },
    async () => {
      return Date.now().toString();
    },
  );
  const nonce = parseInt(nonceResponse);

  // Select chain ID and network based on testnet flag
  const signatureChainId = useTestnet
    ? '0x66eee' // Arbitrum Sepolia testnet chain ID: 421614
    : '0xa4b1'; // Arbitrum mainnet chain ID: 42161
  const hyperliquidChain = useTestnet ? 'Testnet' : 'Mainnet';

  const transferAction = parser(UsdClassTransferRequest.entries.action)({
    type: 'usdClassTransfer',
    // Convert amount from raw units (e.g., "1000000" for 1.0 USDC) to formatted string (e.g., "1.0")
    // Hyperliquid expects the amount as a string in human-readable format
    amount: ethers.utils.formatUnits(amount, 6),
    signatureChainId,
    hyperliquidChain,
    toPerp: to === 'perp',
    nonce,
  });

  // UsdClassTransfer is a user-signed action that uses EIP-712 typed data
  const pkpEthersWallet = new LitActionPkpEthersWallet(pkpPublicKey);
  const signature = await signUserSignedAction({
    wallet: pkpEthersWallet,
    action: transferAction,
    types: UsdClassTransferTypes,
  });

  const transferResult = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'HyperLiquidTransferRequest' },
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
