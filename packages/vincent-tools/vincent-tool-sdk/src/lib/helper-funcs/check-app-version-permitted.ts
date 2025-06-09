import { LIT_NETWORK, RPC_URL_BY_NETWORK } from '@lit-protocol/constants';
import { ethers } from 'ethers';

import { getEnv } from './get-env';

const VINCENT_USER_VIEW_CONTRACT_ABI = [
  'function getPermittedAppVersionForPkp(uint256 pkpTokenId, uint256 appId) view returns (uint256)',
];

export const checkVincentAppVersionPermitted = async ({
  pkpTokenId,
  appId,
  appVersion,
}: {
  pkpTokenId: string;
  appId: number;
  appVersion: number;
}): Promise<{
  isPermitted: boolean;
  permittedAppVersion: number;
}> => {
  const VINCENT_ADDRESS = getEnv('VINCENT_ADDRESS');
  if (VINCENT_ADDRESS === undefined) {
    throw new Error(
      `VINCENT_ADDRESS environment variable is not set. Please set it to the address of the Vincent contract.`,
    );
  }

  const provider = new ethers.providers.StaticJsonRpcProvider(
    RPC_URL_BY_NETWORK[LIT_NETWORK.Datil],
  );
  const vincentContract = new ethers.Contract(
    VINCENT_ADDRESS,
    VINCENT_USER_VIEW_CONTRACT_ABI,
    provider,
  );

  const permittedVersionResult = await vincentContract.getPermittedAppVersionForPkp(
    pkpTokenId,
    appId,
  );
  const permittedAppVersion = (permittedVersionResult as ethers.BigNumber).toNumber();

  const isPermitted = permittedAppVersion === appVersion;

  return {
    isPermitted,
    permittedAppVersion,
  };
};
