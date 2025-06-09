import { type BigNumber, ethers } from 'ethers';

export const checkNativeTokenBalance = async ({
  ethAddress,
  rpcUrl,
  minBalance,
}: {
  ethAddress: string;
  rpcUrl: string;
  minBalance?: BigNumber;
}) => {
  const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);
  const balance = await provider.getBalance(ethAddress);

  return {
    balance,
    hasMinBalance: minBalance !== undefined ? balance.gte(minBalance) : undefined,
  };
};
