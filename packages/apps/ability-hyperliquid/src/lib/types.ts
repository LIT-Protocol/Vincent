/**
 * Bridge contract address on Arbitrum
 * Minimum deposit: 5 USDC + 1 USDC fee = 6 USDC total
 */
export const HYPERLIQUID_BRIDGE_ADDRESS = '0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7';

/**
 * USDC address on Arbitrum (standard ERC20)
 */
export const ARBITRUM_USDC_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';

export type DepositPrechecksResult = DepositPrechecksResultSuccess | DepositPrechecksResultFailure;

export interface DepositPrechecksResultSuccess {
  success: true;
  balance: string;
}

export interface DepositPrechecksResultFailure {
  success: false;
  reason: string;
  balance: string;
}
