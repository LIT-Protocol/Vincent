import * as hyperliquid from '@nktkas/hyperliquid';
import {
  UsdClassTransferRequest,
  UsdClassTransferTypes,
  SuccessResponse,
  parser,
} from '@nktkas/hyperliquid/api/exchange';
import { signUserSignedAction } from '@nktkas/hyperliquid/signing';
import { ethers } from 'ethers';
import { bigIntReplacer } from '@lit-protocol/vincent-ability-sdk';

import { LitActionPkpEthersWallet } from './lit-action-pkp-ethers-wallet';
import { getHyperliquidNonce } from './get-hyperliquid-nonce';
import { getHyperliquidChainId, getHyperliquidChainName } from './get-hyperliquid-chain-id';

export type TransferUsdcResult = {
  transferResult: SuccessResponse;
};

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
}): Promise<TransferUsdcResult> {
  if (to !== 'spot' && to !== 'perp') {
    throw new Error(
      '[transferUsdcTo] Invalid transfer destination. Must be either "spot" or "perp".',
    );
  }

  const nonce = await getHyperliquidNonce();

  const transferAction = parser(UsdClassTransferRequest.entries.action)({
    type: 'usdClassTransfer',
    // Convert amount from raw units (e.g., "1000000" for 1.0 USDC) to formatted string (e.g., "1.0")
    // Hyperliquid expects the amount as a string in human-readable format
    amount: ethers.utils.formatUnits(amount, 6),
    signatureChainId: getHyperliquidChainId(useTestnet),
    hyperliquidChain: getHyperliquidChainName(useTestnet),
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
    transferResult: parsedTransferResult.result as SuccessResponse,
  };
}
