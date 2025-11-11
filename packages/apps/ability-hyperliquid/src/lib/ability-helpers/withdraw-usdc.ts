import * as hyperliquid from '@nktkas/hyperliquid';
import {
  Withdraw3Request,
  Withdraw3Types,
  SuccessResponse,
  parser,
} from '@nktkas/hyperliquid/api/exchange';
import { signUserSignedAction } from '@nktkas/hyperliquid/signing';
import { ethers } from 'ethers';
import { bigIntReplacer } from '@lit-protocol/vincent-ability-sdk';

import { LitActionPkpEthersWallet } from './lit-action-pkp-ethers-wallet';
import { getHyperliquidNonce } from './get-hyperliquid-nonce';

export type WithdrawUsdcResult = {
  withdrawResult: SuccessResponse;
};

/**
 * Withdraw funds from Hyperliquid Perp account to L1 (Arbitrum)
 */
export async function withdrawUsdc({
  transport,
  pkpPublicKey,
  amount,
  destination,
  useTestnet = false,
}: {
  transport: hyperliquid.HttpTransport;
  pkpPublicKey: string;
  amount: string;
  destination: string;
  useTestnet?: boolean;
}): Promise<WithdrawUsdcResult> {
  // Create PKP wallet
  const pkpWallet = new LitActionPkpEthersWallet(pkpPublicKey);
  const nonce = await getHyperliquidNonce();

  // Select chain ID and network based on testnet flag
  const signatureChainId = useTestnet
    ? '0x66eee' // Arbitrum Sepolia testnet chain ID: 421614
    : '0xa4b1'; // Arbitrum mainnet chain ID: 42161
  const hyperliquidChain = useTestnet ? 'Testnet' : 'Mainnet';

  // Construct withdraw action
  const withdrawAction = parser(Withdraw3Request.entries.action)({
    type: 'withdraw3',
    signatureChainId,
    hyperliquidChain,
    destination,
    // Convert amount from raw units (e.g., "1000000" for 1.0 USDC) to formatted string (e.g., "1.0")
    // Hyperliquid expects the amount as a string in human-readable format
    amount: ethers.utils.formatUnits(amount, 6),
    time: nonce,
  });

  // Withdraw3 is a user-signed action that uses EIP-712 typed data
  const signature = await signUserSignedAction({
    wallet: pkpWallet,
    action: withdrawAction,
    types: Withdraw3Types,
  });

  const withdrawResult = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'HyperLiquidWithdrawRequest' },
    async () => {
      return JSON.stringify(
        {
          result: await transport.request('exchange', {
            action: withdrawAction,
            signature,
            nonce,
          }),
        },
        bigIntReplacer,
        2,
      );
    },
  );

  const parsedWithdrawResult = JSON.parse(withdrawResult);
  return {
    withdrawResult: parsedWithdrawResult.result as SuccessResponse,
  };
}
