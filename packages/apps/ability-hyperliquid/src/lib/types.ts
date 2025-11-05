/**
 * Bridge contract address on Arbitrum Mainnet
 * Minimum deposit: 5 USDC + 1 USDC fee = 6 USDC total
 */
export const HYPERLIQUID_BRIDGE_ADDRESS_MAINNET = '0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7';

/**
 * Bridge contract address on Arbitrum Sepolia (Testnet)
 */
export const HYPERLIQUID_BRIDGE_ADDRESS_TESTNET = '0xEdB6e5c456B7ccA2EB1e5c7007f4Ab80426CD20F';

/**
 * USDC address on Arbitrum Mainnet (standard ERC20)
 */
export const ARBITRUM_USDC_ADDRESS_MAINNET = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';

/**
 * USDC address on Arbitrum Sepolia Testnet (standard ERC20)
 */
export const ARBITRUM_USDC_ADDRESS_TESTNET = '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';

// Legacy exports for backwards compatibility
export const HYPERLIQUID_BRIDGE_ADDRESS = HYPERLIQUID_BRIDGE_ADDRESS_MAINNET;
export const ARBITRUM_USDC_ADDRESS = ARBITRUM_USDC_ADDRESS_MAINNET;

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
