import { PublicClient } from 'viem';

export const checkNativeTokenBalance = async ({
  client,
  pkpEthAddress,
}: {
  client: PublicClient;
  pkpEthAddress: `0x${string}`;
}) => {
  const ethBalance = await client.getBalance({
    address: pkpEthAddress as `0x${string}`,
  });

  if (ethBalance === 0n) {
    throw new Error(
      `pkpEthAddress (${pkpEthAddress}) has zero native token balance (UniswapSwapToolPrecheck)`,
    );
  }

  return ethBalance;
};
