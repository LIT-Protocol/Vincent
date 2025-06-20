/**
 * Due to the usage of arbitrum stylus contracts,
 * the gas limit is increased by 10% to avoid reverts due to out of gas errors
 */
const GAS_LIMIT_INCREASE_PERCENTAGE = 10;
export const GAS_LIMIT_ADJUSTMENT = BigInt(100 + GAS_LIMIT_INCREASE_PERCENTAGE);
