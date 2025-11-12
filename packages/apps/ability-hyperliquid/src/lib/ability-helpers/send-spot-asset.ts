import * as hyperliquid from '@nktkas/hyperliquid';
import {
  SpotSendRequest,
  SpotSendTypes,
  SuccessResponse,
  parser,
} from '@nktkas/hyperliquid/api/exchange';
import { signUserSignedAction } from '@nktkas/hyperliquid/signing';
import { ethers } from 'ethers';
import { bigIntReplacer } from '@lit-protocol/vincent-ability-sdk';

import { LitActionPkpEthersWallet } from './lit-action-pkp-ethers-wallet';
import { getHyperliquidNonce } from './get-hyperliquid-nonce';

export type SendSpotAssetResult = {
  sendResult: SuccessResponse;
};

/**
 * Send spot assets (USDC or other tokens) to another Hyperliquid spot account
 */
export async function sendSpotAsset({
  transport,
  pkpPublicKey,
  destination,
  token,
  amount,
  useTestnet = false,
}: {
  transport: hyperliquid.HttpTransport;
  pkpPublicKey: string;
  destination: string;
  token: string;
  amount: string;
  useTestnet?: boolean;
}): Promise<SendSpotAssetResult> {
  const pkpWallet = new LitActionPkpEthersWallet(pkpPublicKey);
  const nonce = await getHyperliquidNonce();

  // Fetch token metadata to get the correct decimal places
  const infoClient = new hyperliquid.InfoClient({ transport });
  const spotMeta = await infoClient.spotMeta();

  // Find the token in the metadata
  const tokenInfo = spotMeta.tokens.find((t) => t.name === token);
  if (!tokenInfo) {
    throw new Error(`Token ${token} not found in spot metadata`);
  }
  console.log('[sendAsset] Token info:', tokenInfo);

  // Select chain ID and network based on testnet flag
  const signatureChainId = useTestnet
    ? '0x66eee' // Arbitrum Sepolia testnet chain ID: 421614
    : '0xa4b1'; // Arbitrum mainnet chain ID: 42161
  const hyperliquidChain = useTestnet ? 'Testnet' : 'Mainnet';

  // Construct send action
  const sendAction = parser(SpotSendRequest.entries.action)({
    type: 'spotSend',
    signatureChainId,
    hyperliquidChain,
    destination,
    // Construct token identifier in the format expected by SpotSend: "name:0xaddress"
    token: `${tokenInfo.name}:${tokenInfo.tokenId}`,
    // Convert amount from smallest units (micro-units) to human-readable format
    // using weiDecimals which represents the exchange precision for amounts
    amount: ethers.utils.formatUnits(amount, tokenInfo.weiDecimals),
    time: nonce,
  });

  // SpotSend is a user-signed action that uses EIP-712 typed data
  const signature = await signUserSignedAction({
    wallet: pkpWallet,
    action: sendAction,
    types: SpotSendTypes,
  });

  const sendResult = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'HyperLiquidSendAssetRequest' },
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
