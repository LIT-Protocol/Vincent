import { getTokenAmountInUsd } from '.';
import { getSpendingLimitContractInstance } from './spending-limit-contract';

export const checkIfBuyAmountAllowed = async ({
  ethRpcUrl,
  rpcUrlForUniswap,
  chainIdForUniswap,
  tokenAddress,
  tokenDecimals,
  buyAmount,
  maxDailySpendAmountUsd,
  pkpEthAddress,
  appId,
}: {
  ethRpcUrl: string;
  rpcUrlForUniswap: string;
  chainIdForUniswap: number;
  tokenAddress: `0x${string}`;
  tokenDecimals: number;
  buyAmount: number;
  maxDailySpendAmountUsd: number;
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
  const adjustedMaxDailySpendingLimit = BigInt(maxDailySpendAmountUsd) * 1_000_000n;
  console.log(
    `Adjusted maxDailySpendingLimitInUsdCents to 8 decimal precision: ${adjustedMaxDailySpendingLimit.toString()} (spendingLimitPolicyPrecheck)`,
  );

  const spendingLimitContract = getSpendingLimitContractInstance();
  const buyAmountAllowed = await spendingLimitContract.read.checkLimit([
    pkpEthAddress,
    BigInt(appId),
    buyAmountInUsd,
    adjustedMaxDailySpendingLimit,
    86400n, // number of seconds in a day
  ]);
  console.log(`Buy amount allowed: ${buyAmountAllowed} (spendingLimitPolicyPrecheck)`);

  return { buyAmountAllowed, buyAmountInUsd, adjustedMaxDailySpendingLimit };
};
