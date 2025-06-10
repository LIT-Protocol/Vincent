import { ethers } from 'ethers';
import { LIT_NETWORK, RPC_URL_BY_NETWORK } from '@lit-protocol/constants';

import { getEnv } from './get-env';

const VINCENT_APP_VIEW_CONTRACT_ABI = [
  'function getAppById(uint256 appId) view returns ((uint256 id, string name, string description, bool isDeleted, uint8 deploymentStatus, address manager, uint256 latestVersion, address[] delegatees, string[] authorizedRedirectUris) app)',
  'function getAppVersion(uint256 appId, uint256 version) view returns ((uint256 id, string name, string description, bool isDeleted, uint8 deploymentStatus, address manager, uint256 latestVersion, address[] delegatees, string[] authorizedRedirectUris) app, (uint256 version, bool enabled, uint256[] delegatedAgentPkpTokenIds, (string toolIpfsCid, (string policyIpfsCid, string[] parameterNames, uint8[] parameterTypes)[] policies)[] tools) appVersion)',
];

export const getVincentApp = async ({
  appId,
  appVersion,
}: {
  appId: number;
  appVersion: number;
}) => {
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
    VINCENT_APP_VIEW_CONTRACT_ABI,
    provider,
  );

  const { app, appVersion: appVersionInfo } = await vincentContract.getAppVersion(
    appId,
    appVersion,
  );

  return {
    app,
    appVersion: appVersionInfo,
  };
};
