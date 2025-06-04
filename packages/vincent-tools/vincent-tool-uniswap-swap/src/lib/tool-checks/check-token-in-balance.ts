import { parseAbi } from 'viem';

import { PublicClient } from 'viem';

export const checkTokenInBalance = async ({
  client,
  pkpEthAddress,
  tokenInAddress,
  tokenInAmount,
}: {
  client: PublicClient;
  pkpEthAddress: `0x${string}`;
  tokenInAddress: `0x${string}`;
  tokenInAmount: bigint;
}) => {
  const tokenInBalance = await client.readContract({
    address: tokenInAddress,
    abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
    functionName: 'balanceOf',
    args: [pkpEthAddress],
  });

  if (tokenInBalance < tokenInAmount) {
    throw new Error(
      `pkpEthAddress (${pkpEthAddress}) has insufficient balance of tokenIn (${tokenInAddress}). Wanted ${tokenInAmount}, but only have ${tokenInBalance} (checkTokenInBalance)`,
    );
  }

  return tokenInBalance;
};
