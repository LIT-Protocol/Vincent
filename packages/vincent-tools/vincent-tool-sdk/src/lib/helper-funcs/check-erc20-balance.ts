import { type BigNumber, ethers } from 'ethers';

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

export const checkErc20Balance = async ({
  ethAddress,
  rpcUrl,
  erc20Address,
  minBalance,
}: {
  ethAddress: string;
  rpcUrl: string;
  erc20Address: string;
  minBalance?: BigNumber;
}) => {
  const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);
  const erc20Contract = new ethers.Contract(erc20Address, ERC20_ABI, provider);
  const balance = (await erc20Contract.balanceOf(ethAddress)) as ethers.BigNumber;

  return {
    balance,
    hasMinBalance: minBalance !== undefined ? balance.gte(minBalance) : undefined,
  };
};
