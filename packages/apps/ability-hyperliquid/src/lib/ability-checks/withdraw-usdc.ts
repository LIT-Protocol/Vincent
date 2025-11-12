import { ethers } from 'ethers';
import * as hyperliquid from '@nktkas/hyperliquid';

export type WithdrawPrechecksResult =
  | WithdrawPrechecksResultSuccess
  | WithdrawPrechecksResultFailure;

export interface WithdrawPrechecksResultSuccess {
  success: true;
  availableBalance: string;
  requiredBalance: string;
}

export interface WithdrawPrechecksResultFailure {
  success: false;
  reason: string;
  availableBalance?: string;
  requiredBalance?: string;
}

export interface WithdrawParams {
  amount: string;
}

/**
 * Check if withdrawal from Hyperliquid to L1 can be executed
 */
export async function withdrawPrechecks({
  infoClient,
  ethAddress,
  params,
}: {
  infoClient: hyperliquid.InfoClient;
  ethAddress: string;
  params: WithdrawParams;
}): Promise<WithdrawPrechecksResult> {
  // Withdrawal comes from perp account
  const clearinghouseState = await infoClient.clearinghouseState({
    user: ethAddress,
  });

  const availableUsdcBalance = ethers.utils.parseUnits(
    clearinghouseState.marginSummary.accountValue,
    6, // USDC has 6 decimals
  );

  const requestedAmount = ethers.BigNumber.from(params.amount);
  const minimumWithdrawAmount = ethers.utils.parseUnits('1', 6); // 1 USDC minimum (withdrawal fee)

  // Check if requested amount is at least 1 USDC
  if (requestedAmount.lt(minimumWithdrawAmount)) {
    return {
      success: false,
      reason: `Withdrawal amount must be at least 1 USDC due to withdrawal fee. Requested: ${ethers.utils.formatUnits(requestedAmount, 6)} USDC`,
      availableBalance: ethers.utils.formatUnits(availableUsdcBalance, 6),
      requiredBalance: ethers.utils.formatUnits(minimumWithdrawAmount, 6),
    };
  }

  if (availableUsdcBalance.lt(requestedAmount)) {
    return {
      success: false,
      reason: `Insufficient perp balance for withdrawal. Available: ${ethers.utils.formatUnits(availableUsdcBalance, 6)} USDC, Requested: ${ethers.utils.formatUnits(requestedAmount, 6)} USDC`,
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
