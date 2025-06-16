import { getTokenAmountInUsd } from './get-token-amount-in-usd';
import { getSpendingLimitContractInstance } from './spending-limit-contract';

export const checkIfBuyAmountAllowed = async ({
  ethRpcUrl,
  rpcUrlForUniswap,
  chainIdForUniswap,
  tokenAddress,
  tokenDecimals,
  buyAmount,
  maxDailySpendingLimitInUsdCents,
  pkpEthAddress,
  appId,
}: {
  ethRpcUrl: string;
  rpcUrlForUniswap: string;
  chainIdForUniswap: number;
  tokenAddress: `0x${string}`;
  tokenDecimals: number;
  buyAmount: number;
  maxDailySpendingLimitInUsdCents: bigint;
  pkpEthAddress: `0x${string}`;
  appId: number;
}): Promise<{
  buyAmountAllowed: boolean;
  buyAmountInUsd: bigint;
  adjustedMaxDailySpendingLimit: bigint;
}> => {
  const buyAmountInUsd = await getTokenAmountInUsd({
    ethRpcUrl,
    rpcUrlForUniswap,
    chainIdForUniswap,
    tokenAddress,
    tokenDecimals,
    tokenAmount: buyAmount,
  });

  // maxDailySpendingLimitInUsdCents has 2 decimal precision, but tokenAmountInUsd has 8,
  // so we multiply by 10^6 to match the precision
  const adjustedMaxDailySpendingLimit = maxDailySpendingLimitInUsdCents * 1_000_000n;
  console.log(
    `Adjusted maxDailySpendingLimitInUsdCents to 8 decimal precision: ${adjustedMaxDailySpendingLimit.toString()} (spendingLimitPolicyPrecheck)`,
  );

  const spendingLimitContract = getSpendingLimitContractInstance();

  const buyAmountAllowed = await spendingLimitContract.checkLimit(
    pkpEthAddress,
    BigInt(appId),
    buyAmountInUsd.toBigInt(),
    adjustedMaxDailySpendingLimit,
    86400n, // number of seconds in a day
  );

  console.log(
    `Buy amount allowed: ${JSON.stringify(buyAmountAllowed)} (spendingLimitPolicyPrecheck)`,
  );

  return {
    buyAmountAllowed,
    buyAmountInUsd: buyAmountInUsd.toBigInt(),
    adjustedMaxDailySpendingLimit,
  };
};
