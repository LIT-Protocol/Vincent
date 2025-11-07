import { ethers } from 'ethers';
import * as hyperliquid from '@nktkas/hyperliquid';

export type TransferPrechecksResult =
  | TransferPrechecksResultSuccess
  | TransferPrechecksResultFailure;

export interface TransferPrechecksResultSuccess {
  success: true;
  availableBalance: string;
  requiredBalance: string;
}

export interface TransferPrechecksResultFailure {
  success: false;
  reason: string;
  availableBalance?: string;
  requiredBalance?: string;
}

export interface TransferParams {
  amount: string;
  to: 'spot' | 'perp';
}

/**
 * Check if transfer between spot and perp accounts can be executed
 */
export async function transferPrechecks({
  infoClient,
  ethAddress,
  params,
}: {
  infoClient: hyperliquid.InfoClient;
  ethAddress: string;
  params: TransferParams;
}): Promise<TransferPrechecksResult> {
  // Transfer to spot means we're transferring FROM perp
  // Transfer to perp means we're transferring FROM spot
  if (params.to === 'spot') {
    // Check perp account balance
    const clearinghouseState = await infoClient.clearinghouseState({
      user: ethAddress,
    });

    const availableUsdcBalance = ethers.utils.parseUnits(
      clearinghouseState.marginSummary.accountValue,
      6, // USDC has 6 decimals
    );

    const requestedAmount = ethers.BigNumber.from(params.amount);

    if (availableUsdcBalance.lt(requestedAmount)) {
      return {
        success: false,
        reason: `Insufficient perp balance. Available: ${ethers.utils.formatUnits(availableUsdcBalance, 6)} USDC, Requested: ${ethers.utils.formatUnits(requestedAmount, 6)} USDC`,
        availableBalance: ethers.utils.formatUnits(availableUsdcBalance, 6),
        requiredBalance: ethers.utils.formatUnits(requestedAmount, 6),
      };
    }

    return {
      success: true,
      availableBalance: ethers.utils.formatUnits(availableUsdcBalance, 6),
      requiredBalance: ethers.utils.formatUnits(requestedAmount, 6),
    };
  } else {
    // Check spot account balance
    const spotState = await infoClient.spotClearinghouseState({
      user: ethAddress,
    });

    // Find USDC balance in spot account
    const usdcBalance = spotState.balances.find((b) => b.coin === 'USDC');

    if (!usdcBalance) {
      return {
        success: false,
        reason: 'No USDC balance found in spot account',
        availableBalance: '0',
      };
    }

    // When returned from the Hyperliquid API, the balance is in 8 decimals
    const availableUsdcBalance = ethers.utils.parseUnits(usdcBalance.total, 8);
    const requestedAmount = ethers.BigNumber.from(params.amount);

    if (availableUsdcBalance.lt(requestedAmount)) {
      return {
        success: false,
        reason: `Insufficient spot balance. Available: ${ethers.utils.formatUnits(availableUsdcBalance, 8)} USDC, Requested: ${ethers.utils.formatUnits(requestedAmount, 6)} USDC`,
        availableBalance: availableUsdcBalance.toString(),
        requiredBalance: ethers.utils.formatUnits(requestedAmount, 6),
      };
    }

    return {
      success: true,
      availableBalance: availableUsdcBalance.toString(),
      requiredBalance: requestedAmount.toString(),
    };
  }
}
