import { LIT_NETWORK, RPC_URL_BY_NETWORK } from '@lit-protocol/constants';
import { ethers } from 'ethers';

import { getEnv } from './get-env';
import { checkNativeTokenBalance } from './check-native-balance';

const VINCENT_CONTRACT_ABI = [
  'function permitAppVersion(uint256 pkpTokenId, uint256 appId, uint256 appVersion, string[] toolIpfsCids, string[][] policyIpfsCids, string[][][] policyParameterNames, bytes[][][] policyParameterValues)',
  'event AppVersionPermitted(uint256 indexed pkpTokenId, uint256 indexed appId, uint256 indexed appVersion)',
];

export interface VincentPolicyParameterValue {
  name: string;
  value: string; // ABI-encoded bytes value
}

export interface VincentPolicyWithValues {
  ipfsCid: string;
  parameterNames: string[];
  parameterTypes: number[];
  parameterValues: VincentPolicyParameterValue[];
}

export interface VincentToolWithValues {
  ipfsCid: string;
  policies: VincentPolicyWithValues[];
}

export const permitVincentAppVersion = async ({
  pkpTokenId,
  appId,
  appVersion,
  vincentToolsWithValues,
  pkpOwnerPrivateKey,
}: {
  pkpTokenId: string;
  appId: number;
  appVersion: number;
  vincentToolsWithValues: VincentToolWithValues[];
  pkpOwnerPrivateKey: string;
}): Promise<{ pkpTokenId: string; appId: number; appVersion: number; txHash: string }> => {
  const VINCENT_ADDRESS = getEnv('VINCENT_ADDRESS');
  if (VINCENT_ADDRESS === undefined) {
    throw new Error(
      `VINCENT_ADDRESS environment variable is not set. Please set it to the address of the Vincent contract.`,
    );
  }

  const pkpOwnerEthersWallet = new ethers.Wallet(pkpOwnerPrivateKey);

  const MIN_ETH_BALANCE = ethers.utils.parseEther('0.01');
  const { balance, hasMinBalance } = await checkNativeTokenBalance({
    ethAddress: pkpOwnerEthersWallet.address,
    rpcUrl: RPC_URL_BY_NETWORK[LIT_NETWORK.Datil],
    minBalance: MIN_ETH_BALANCE,
  });
  if (!hasMinBalance) {
    throw new Error(
      `PKP Owner (${pkpOwnerEthersWallet.address}) doesn't have the minimum required balance of ${ethers.utils.formatEther(MIN_ETH_BALANCE)} ETH on the Lit Datil network. Current balance is ${ethers.utils.formatEther(balance)} ETH. Please fund the PKP Owner before continuing using the Lit test token faucet: https://chronicle-yellowstone-faucet.getlit.dev/.`,
    );
  }

  const provider = new ethers.providers.StaticJsonRpcProvider(
    RPC_URL_BY_NETWORK[LIT_NETWORK.Datil],
  );
  const connectedWallet = pkpOwnerEthersWallet.connect(provider);
  const vincentContract = new ethers.Contract(
    VINCENT_ADDRESS,
    VINCENT_CONTRACT_ABI,
    connectedWallet,
  );

  // Extract parameters from vincentToolsWithValues
  const TOOL_IPFS_IDS = vincentToolsWithValues.map((tool) => tool.ipfsCid);
  const POLICY_IPFS_CIDS = vincentToolsWithValues.map((tool) =>
    tool.policies.map((policy) => policy.ipfsCid),
  );
  const POLICY_PARAMETER_NAMES = vincentToolsWithValues.map((tool) =>
    tool.policies.map((policy) => policy.parameterNames),
  );
  const POLICY_PARAMETER_VALUES = vincentToolsWithValues.map((tool) =>
    tool.policies.map((policy) => policy.parameterValues.map((paramValue) => paramValue.value)),
  );

  const tx = await vincentContract.permitAppVersion(
    pkpTokenId,
    appId,
    appVersion,
    TOOL_IPFS_IDS,
    POLICY_IPFS_CIDS,
    POLICY_PARAMETER_NAMES,
    POLICY_PARAMETER_VALUES,
  );

  const txReceipt = await tx.wait();

  // Parse the AppVersionPermitted event to confirm the permission was granted
  const vincentInterface = new ethers.utils.Interface(VINCENT_CONTRACT_ABI);
  const parsedLogs = txReceipt.logs
    .map((log: any) => {
      try {
        return vincentInterface.parseLog(log);
      } catch {
        return null;
      }
    })
    .filter((log: any) => log !== null);

  const appVersionPermittedLog = parsedLogs.find((log: any) => log?.name === 'AppVersionPermitted');
  if (!appVersionPermittedLog) {
    throw new Error('AppVersionPermitted event not found in transaction logs');
  }

  const permittedPkpTokenId = appVersionPermittedLog.args.pkpTokenId as ethers.BigNumber;
  const permittedAppId = appVersionPermittedLog.args.appId as ethers.BigNumber;
  const permittedAppVersion = appVersionPermittedLog.args.appVersion as ethers.BigNumber;

  // Verify the event matches our request
  if (
    permittedPkpTokenId.toString() !== pkpTokenId ||
    permittedAppId.toNumber() !== appId ||
    permittedAppVersion.toNumber() !== appVersion
  ) {
    throw new Error(
      `Mismatch in AppVersionPermitted event: expected pkpTokenId ${pkpTokenId}, appId ${appId}, appVersion ${appVersion}, got pkpTokenId ${permittedPkpTokenId.toString()}, appId ${permittedAppId.toNumber()}, appVersion ${permittedAppVersion.toNumber()}`,
    );
  }

  return {
    pkpTokenId: permittedPkpTokenId.toString(),
    appId: permittedAppId.toNumber(),
    appVersion: permittedAppVersion.toNumber(),
    txHash: txReceipt.transactionHash,
  };
};
