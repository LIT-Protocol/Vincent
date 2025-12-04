import type { PublicClient } from 'viem';

export const assertValidEntryPointAddress = async (
  entryPointAddress: string,
  publicClient: PublicClient,
) => {
  const supportedEntryPoints = (await publicClient.request({
    // @ts-expect-error viem types do not include this method
    method: 'eth_supportedEntryPoints',
  })) as string[];

  if (!supportedEntryPoints.includes(entryPointAddress)) {
    throw new Error('Entry point not supported');
  }

  return true;
};
