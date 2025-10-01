import { ethers } from 'ethers';

export const entryPointIface = new ethers.utils.Interface([
  'function getNonce(address sender, uint192 key) view returns (uint256)',
]);

export const getEntryPointContract = (
  entryPointAddress: string,
  provider: ethers.providers.JsonRpcProvider,
) => new ethers.Contract(entryPointAddress, entryPointIface, provider);

export const assertValidEntryPointAddress = async (
  entryPointAddress: string,
  provider: ethers.providers.JsonRpcProvider,
) => {
  const supportedEntryPoints = (await provider.send('eth_supportedEntryPoints', [])) as string[];

  if (!supportedEntryPoints.includes(entryPointAddress)) {
    throw new Error('Entry point not supported');
  }

  return true;
};

export const getSmartAccountNonce = async ({
  accountAddress,
  entryPointAddress,
  key = 0,
  provider,
}: {
  accountAddress: string;
  entryPointAddress: string;
  key?: number;
  provider: ethers.providers.JsonRpcProvider;
}) => {
  const entryPoint = getEntryPointContract(entryPointAddress, provider);
  return await entryPoint.getNonce(accountAddress, key);
};
