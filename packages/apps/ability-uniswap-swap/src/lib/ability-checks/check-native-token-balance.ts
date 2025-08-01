import { ethers } from 'ethers';

export const checkNativeTokenBalance = async ({
  provider,
  pkpEthAddress,
}: {
  provider: ethers.providers.Provider;
  pkpEthAddress: string;
}) => {
  const ethBalance = await provider.getBalance(pkpEthAddress);

  if (ethBalance.isZero()) {
    throw new Error(
      `pkpEthAddress (${pkpEthAddress}) has zero native token balance (UniswapSwapAbilityPrecheck)`,
    );
  }

  return ethBalance;
};
