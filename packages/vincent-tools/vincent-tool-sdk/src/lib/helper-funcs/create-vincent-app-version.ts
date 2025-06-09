import { LIT_NETWORK, RPC_URL_BY_NETWORK } from '@lit-protocol/constants';
import { ethers } from 'ethers';

import { getEnv } from './get-env';
import { checkNativeTokenBalance } from './check-native-balance';
import { VincentToolMetadata, VincentAppInfo } from './create-vincent-app';

const VINCENT_CONTRACT_ABI = [
  'function registerNextAppVersion(uint256 appId, (string[] toolIpfsCids, string[][] toolPolicies, string[][][] toolPolicyParameterNames, uint8[][][] toolPolicyParameterTypes) versionTools) returns (uint256 newAppVersion)',
  'event NewAppVersionRegistered(uint256 indexed appId, uint256 indexed appVersion, address indexed manager)',
];

export const createVincentAppVersion = async ({
  appId,
  vincentTools,
}: {
  appId: number;
  vincentTools: VincentToolMetadata[];
}): Promise<VincentAppInfo> => {
  const VINCENT_ADDRESS = getEnv('VINCENT_ADDRESS');
  if (VINCENT_ADDRESS === undefined) {
    throw new Error(
      `VINCENT_ADDRESS environment variable is not set. Please set it to the address of the Vincent contract.`,
    );
  }

  const TEST_VINCENT_APP_MANAGER_PRIVATE_KEY = getEnv('TEST_VINCENT_APP_MANAGER_PRIVATE_KEY');
  if (TEST_VINCENT_APP_MANAGER_PRIVATE_KEY === undefined) {
    throw new Error(
      `TEST_VINCENT_APP_MANAGER_PRIVATE_KEY environment variable is not set. Please set it to the private key that will be used to create the test Vincent App version.`,
    );
  }
  const appManagerEthersWallet = new ethers.Wallet(TEST_VINCENT_APP_MANAGER_PRIVATE_KEY);

  const MIN_ETH_BALANCE = ethers.utils.parseEther('0.01');
  const { balance, hasMinBalance } = await checkNativeTokenBalance({
    ethAddress: appManagerEthersWallet.address,
    rpcUrl: RPC_URL_BY_NETWORK[LIT_NETWORK.Datil],
    minBalance: MIN_ETH_BALANCE,
  });
  if (!hasMinBalance) {
    throw new Error(
      `App Manager (${appManagerEthersWallet.address}) doesn't have the minimum required balance of ${ethers.utils.formatEther(MIN_ETH_BALANCE)} ETH on the Lit Datil network. Current balance is ${ethers.utils.formatEther(balance)} ETH. Please fund the App Manager before continuing using the Lit test token faucet: https://chronicle-yellowstone-faucet.getlit.dev/.`,
    );
  }

  const provider = new ethers.providers.StaticJsonRpcProvider(
    RPC_URL_BY_NETWORK[LIT_NETWORK.Datil],
  );
  const connectedWallet = appManagerEthersWallet.connect(provider);
  const vincentContract = new ethers.Contract(
    VINCENT_ADDRESS,
    VINCENT_CONTRACT_ABI,
    connectedWallet,
  );

  // Extract tool configurations from vincentTools parameter
  const TOOL_IPFS_IDS = vincentTools.map((tool) => tool.ipfsCid);
  const TOOL_POLICIES = vincentTools.map((tool) => tool.policies.map((policy) => policy.ipfsCid));
  const TOOL_POLICY_PARAMETER_NAMES = vincentTools.map((tool) =>
    tool.policies.map((policy) => policy.parameterNames),
  );
  const TOOL_POLICY_PARAMETER_TYPES = vincentTools.map((tool) =>
    tool.policies.map((policy) => policy.parameterTypes),
  );

  const tx = await vincentContract.registerNextAppVersion(appId, {
    toolIpfsCids: TOOL_IPFS_IDS,
    toolPolicies: TOOL_POLICIES,
    toolPolicyParameterNames: TOOL_POLICY_PARAMETER_NAMES,
    toolPolicyParameterTypes: TOOL_POLICY_PARAMETER_TYPES,
  });

  const txReceipt = await tx.wait();

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

  const newAppVersionRegisteredLog = parsedLogs.find(
    (log: any) => log?.name === 'NewAppVersionRegistered',
  );
  if (!newAppVersionRegisteredLog) {
    throw new Error('NewAppVersionRegistered event not found in transaction logs');
  }

  const newAppVersion = newAppVersionRegisteredLog.args.appVersion as ethers.BigNumber;

  return {
    appId: appId,
    appVersion: newAppVersion.toNumber(),
  };
};
