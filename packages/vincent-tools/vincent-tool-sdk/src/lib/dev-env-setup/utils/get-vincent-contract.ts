import { LIT_NETWORK, RPC_URL_BY_NETWORK } from '@lit-protocol/constants';
import { ethers } from 'ethers';

const VINCENT_CONTRACT_ABI = [
  'function registerApp((string name, string description, uint8 deploymentStatus, string[] authorizedRedirectUris, address[] delegatees) appInfo, (string[] toolIpfsCids, string[][] toolPolicies, string[][][] toolPolicyParameterNames, uint8[][][] toolPolicyParameterTypes) versionTools) returns (uint256 newAppId, uint256 newAppVersion)',
  'function getAppById(uint256 appId) view returns ((uint256 id, string name, string description, bool isDeleted, uint8 deploymentStatus, address manager, uint256 latestVersion, address[] delegatees, string[] authorizedRedirectUris) app)',
  'function getAppVersion(uint256 appId, uint256 version) view returns ((uint256 id, string name, string description, bool isDeleted, uint8 deploymentStatus, address manager, uint256 latestVersion, address[] delegatees, string[] authorizedRedirectUris) app, (uint256 version, bool enabled, uint256[] delegatedAgentPkpTokenIds, (string toolIpfsCid, (string policyIpfsCid, string[] parameterNames, uint8[] parameterTypes)[] policies)[] tools) appVersion)',

  'event NewAppRegistered(uint256 indexed appId, address indexed manager)',
];

export const getVincentContract = async ({
  vincentAddress,
  ethersWallet,
}: {
  vincentAddress: string;
  ethersWallet?: ethers.Wallet;
}) => {
  const provider =
    ethersWallet ??
    new ethers.providers.StaticJsonRpcProvider(RPC_URL_BY_NETWORK[LIT_NETWORK.Datil]);

  return new ethers.Contract(vincentAddress, VINCENT_CONTRACT_ABI, provider);
};
