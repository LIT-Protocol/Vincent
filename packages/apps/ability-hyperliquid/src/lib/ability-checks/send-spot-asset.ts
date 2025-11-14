import { ethers } from 'ethers';
import * as hyperliquid from '@nktkas/hyperliquid';

export type SendSpotAssetPrechecksResult =
  | SendSpotAssetPrechecksResultSuccess
  | SendSpotAssetPrechecksResultFailure;

export interface SendSpotAssetPrechecksResultSuccess {
  success: true;
  availableBalance: string;
  requiredBalance: string;
}

export interface SendSpotAssetPrechecksResultFailure {
  success: false;
  reason: string;
  availableBalance?: string;
  requiredBalance?: string;
}

export interface SendSpotAssetParams {
  destination: string;
  token: string;
  amount: string;
}

/**
 * Check if sending spot assets to another Hyperliquid spot account can be executed
 */
export async function sendSpotAssetPrechecks({
  infoClient,
  ethAddress,
  params,
}: {
  infoClient: hyperliquid.InfoClient;
  ethAddress: string;
  params: SendSpotAssetParams;
}): Promise<SendSpotAssetPrechecksResult> {
  // Validate destination address
  if (!ethers.utils.isAddress(params.destination)) {
    return {
      success: false,
      reason: `Invalid destination address: ${params.destination}`,
    };
  }

  // Fetch token metadata to get the correct decimal places
  const spotMeta = await infoClient.spotMeta();
  const tokenInfo = spotMeta.tokens.find((t) => t.name === params.token);

  if (!tokenInfo) {
    return {
      success: false,
      reason: `Token ${params.token} not found in spot metadata`,
    };
  }

  // Get spot balances
  const spotClearinghouseState = await infoClient.spotClearinghouseState({
    user: ethAddress,
  });

  // Find the token balance
  const tokenBalance = spotClearinghouseState.balances.find(
    (balance) => balance.coin === params.token,
  );

  if (!tokenBalance) {
    return {
      success: false,
      reason: `No balance found for token: ${params.token}`,
      availableBalance: '0',
      requiredBalance: ethers.utils.formatUnits(params.amount, tokenInfo.weiDecimals),
    };
  }

  // Convert the balance from human-readable format to smallest units using token's weiDecimals
  // weiDecimals represents the exchange precision for amounts
  const availableBalance = ethers.BigNumber.from(
    ethers.utils.parseUnits(tokenBalance.total, tokenInfo.weiDecimals),
  );
  console.log('[sendAssetPrechecks] Available balance:', availableBalance);

  const requestedAmount = ethers.BigNumber.from(params.amount);
  console.log('[sendAssetPrechecks] Requested amount:', requestedAmount);

  if (availableBalance.lt(requestedAmount)) {
    return {
      success: false,
      reason: `Insufficient ${params.token} balance for send. Available: ${ethers.utils.formatUnits(availableBalance, tokenInfo.weiDecimals)} ${params.token}, Requested: ${ethers.utils.formatUnits(requestedAmount, tokenInfo.weiDecimals)} ${params.token}`,
      availableBalance: ethers.utils.formatUnits(availableBalance, tokenInfo.weiDecimals),
      requiredBalance: ethers.utils.formatUnits(requestedAmount, tokenInfo.weiDecimals),
    };
  }

  return {
    success: true,
    availableBalance: ethers.utils.formatUnits(availableBalance, tokenInfo.weiDecimals),
    requiredBalance: ethers.utils.formatUnits(requestedAmount, tokenInfo.weiDecimals),
  };
}
