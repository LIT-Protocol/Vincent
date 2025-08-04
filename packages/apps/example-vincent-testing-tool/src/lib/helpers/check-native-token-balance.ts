import { ethers } from 'ethers';

export const checkNativeTokenBalance = async ({
  provider,
  pkpEthAddress,
}: {
  provider: ethers.providers.Provider;
  pkpEthAddress: string;
}): Promise<boolean> => {
  const ethBalance = await provider.getBalance(pkpEthAddress);

  return ethBalance.gt(0n);
};
