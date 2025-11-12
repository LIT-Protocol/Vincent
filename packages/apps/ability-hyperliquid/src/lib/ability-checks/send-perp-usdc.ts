import { ethers } from 'ethers';
import * as hyperliquid from '@nktkas/hyperliquid';

export type SendPerpUsdcPrechecksResult =
  | SendPerpUsdcPrechecksResultSuccess
  | SendPerpUsdcPrechecksResultFailure;

export interface SendPerpUsdcPrechecksResultSuccess {
  success: true;
  availableBalance: string;
  requiredBalance: string;
}

export interface SendPerpUsdcPrechecksResultFailure {
  success: false;
  reason: string;
  availableBalance?: string;
  requiredBalance?: string;
}

export interface SendPerpUsdcParams {
  destination: string;
  amount: string;
}

/**
 * Check if sending USDC from perp account to another Hyperliquid perp account can be executed
 */
export async function sendPerpUsdcPrechecks({
  infoClient,
  ethAddress,
  params,
}: {
  infoClient: hyperliquid.InfoClient;
  ethAddress: string;
  params: SendPerpUsdcParams;
}): Promise<SendPerpUsdcPrechecksResult> {
  // Validate destination address
  if (!ethers.utils.isAddress(params.destination)) {
    return {
      success: false,
      reason: `Invalid destination address: ${params.destination}`,
    };
  }

  // Get perp account balance
  const clearinghouseState = await infoClient.clearinghouseState({
    user: ethAddress,
  });

  const availableUsdcBalance = ethers.utils.parseUnits(
    clearinghouseState.marginSummary.accountValue,
    6, // USDC has 6 decimals
  );
  console.log('[sendPerpUsdcPrechecks] Available balance:', availableUsdcBalance);

  const requestedAmount = ethers.BigNumber.from(params.amount);
  console.log('[sendPerpUsdcPrechecks] Requested amount:', requestedAmount);

  if (availableUsdcBalance.lt(requestedAmount)) {
    return {
      success: false,
      reason: `Insufficient perp balance for send. Available: ${ethers.utils.formatUnits(availableUsdcBalance, 6)} USDC, Requested: ${ethers.utils.formatUnits(requestedAmount, 6)} USDC`,
      availableBalance: ethers.utils.formatUnits(availableUsdcBalance, 6),
      requiredBalance: ethers.utils.formatUnits(requestedAmount, 6),
    };
  }

  return {
    success: true,
    availableBalance: ethers.utils.formatUnits(availableUsdcBalance, 6),
    requiredBalance: ethers.utils.formatUnits(requestedAmount, 6),
  };
}
