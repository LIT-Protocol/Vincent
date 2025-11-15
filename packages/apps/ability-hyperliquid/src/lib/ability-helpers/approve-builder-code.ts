import * as hyperliquid from '@nktkas/hyperliquid';
import {
  ApproveBuilderFeeRequest,
  ApproveBuilderFeeTypes,
  SuccessResponse,
  parser,
} from '@nktkas/hyperliquid/api/exchange';
import { signUserSignedAction } from '@nktkas/hyperliquid/signing';
import { bigIntReplacer } from '@lit-protocol/vincent-ability-sdk';

import { LitActionPkpEthersWallet } from './lit-action-pkp-ethers-wallet';
import { getHyperliquidNonce } from './get-hyperliquid-nonce';
import { getHyperliquidChainId, getHyperliquidChainName } from './get-hyperliquid-chain-id';

export type ApproveBuilderCodeResult = {
  approveResult: SuccessResponse | hyperliquid.ErrorResponse;
};

/**
 * Approve a builder code (builder address) with a maximum fee rate on Hyperliquid
 * @param transport - Hyperliquid HTTP transport instance
 * @param pkpPublicKey - PKP public key for signing
 * @param builderAddress - Builder address to approve
 * @param maxFeeRate - Maximum fee rate as a percentage string (e.g., "0.01" for 0.01%)
 * @param useTestnet - Whether to use testnet (default: false)
 * @returns Approval result from Hyperliquid
 */
export async function approveBuilderCode({
  transport,
  pkpPublicKey,
  builderAddress,
  maxFeeRate,
  useTestnet = false,
}: {
  transport: hyperliquid.HttpTransport;
  pkpPublicKey: string;
  builderAddress: string;
  maxFeeRate: string; // e.g., "0.01" for 0.01%
  useTestnet?: boolean;
}): Promise<ApproveBuilderCodeResult> {
  const pkpWallet = new LitActionPkpEthersWallet(pkpPublicKey);
  const nonce = await getHyperliquidNonce();

  // Ensure maxFeeRate has the % suffix (required by Hyperliquid schema)
  const maxFeeRateWithPercent = maxFeeRate.endsWith('%') ? maxFeeRate : `${maxFeeRate}%`;

  // Construct approve builder fee action
  const approveAction = parser(ApproveBuilderFeeRequest.entries.action)({
    type: 'approveBuilderFee',
    signatureChainId: getHyperliquidChainId(useTestnet),
    hyperliquidChain: getHyperliquidChainName(useTestnet),
    maxFeeRate: maxFeeRateWithPercent,
    builder: builderAddress,
    nonce,
  });

  // ApproveBuilderFee is a user-signed action that uses EIP-712 typed data
  const signature = await signUserSignedAction({
    wallet: pkpWallet,
    action: approveAction,
    types: ApproveBuilderFeeTypes,
  });

  const approveResult = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'HyperLiquidApproveBuilderFeeRequest' },
    async () => {
      return JSON.stringify(
        {
          result: await transport.request('exchange', {
            action: approveAction,
            signature,
            nonce,
          }),
        },
        bigIntReplacer,
        2,
      );
    },
  );

  const parsedApproveResult = JSON.parse(approveResult);
  return {
    approveResult: parsedApproveResult.result as SuccessResponse | hyperliquid.ErrorResponse,
  };
}
