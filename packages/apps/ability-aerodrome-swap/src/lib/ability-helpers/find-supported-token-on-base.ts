import { getListedTokens, type SugarWagmiConfig } from 'sugar-sdk';

export const findSupportedTokenOnBase = async ({
  config,
  chainId,
  tokenAddress,
}: {
  config: SugarWagmiConfig;
  chainId: number;
  tokenAddress: string;
}) => {
  const allTokensSupportedOnBaseMainnet = await getListedTokens({ config });
  return allTokensSupportedOnBaseMainnet.find(
    (token) =>
      token.address.toLowerCase() === tokenAddress.toLowerCase() && token.chainId === chainId,
  );
};
