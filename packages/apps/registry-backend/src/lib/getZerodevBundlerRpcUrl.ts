import { env } from '../env';

export const getZerodevBundlerRpcUrl = (chainId: number) => {
  return `https://rpc.zerodev.app/api/v3/${env.ZERODEV_PROJECT_ID}/chain/${chainId}`;
};
