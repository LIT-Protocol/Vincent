import { LIT_NETWORK, RPC_URL_BY_NETWORK } from '@lit-protocol/constants';
import { ethers } from 'ethers';

import { getEnv } from './get-env';
import { checkNativeTokenBalance } from './check-native-balance';

const TEST_VINCENT_APP_NAME = 'Vincent Test App';
const TEST_VINCENT_APP_DESCRIPTION = 'A test app for the Vincent protocol';
const TEST_VINCENT_APP_AUTHORIZED_REDIRECT_URIS = ['https://testing.vincent.com'];

const VINCENT_CONTRACT_ABI = [
  'function registerApp((string name, string description, uint8 deploymentStatus, string[] authorizedRedirectUris, address[] delegatees) appInfo, (string[] toolIpfsCids, string[][] toolPolicies, string[][][] toolPolicyParameterNames, uint8[][][] toolPolicyParameterTypes) versionTools) returns (uint256 newAppId, uint256 newAppVersion)',
  'event NewAppRegistered(uint256 indexed appId, address indexed manager)',
];

// Enums matching the contract definitions
export enum VINCENT_APP_PARAMETER_TYPE {
  INT256 = 0,
  INT256_ARRAY = 1,
  UINT256 = 2,
  UINT256_ARRAY = 3,
  BOOL = 4,
  BOOL_ARRAY = 5,
  ADDRESS = 6,
  ADDRESS_ARRAY = 7,
  STRING = 8,
  STRING_ARRAY = 9,
  BYTES = 10,
  BYTES_ARRAY = 11,
}

export interface VincentAppInfo {
  appId: number;
  appVersion: number;
}

export interface VincentPolicyMetadata {
  ipfsCid: string;
  parameterNames: string[];
  parameterTypes: number[];
}

export interface VincentToolMetadata {
  ipfsCid: string;
  policies: VincentPolicyMetadata[];
}

export const createVincentApp = async ({
  vincentTools,
}: {
  vincentTools: VincentToolMetadata[];
}) => {
  const VINCENT_ADDRESS = getEnv('VINCENT_ADDRESS');
  if (VINCENT_ADDRESS === undefined) {
    throw new Error(
      `VINCENT_ADDRESS environment variable is not set. Please set it to the address of the Vincent contract.`,
    );
  }

  const TEST_VINCENT_APP_MANAGER_PRIVATE_KEY = getEnv('TEST_VINCENT_APP_MANAGER_PRIVATE_KEY');
  if (TEST_VINCENT_APP_MANAGER_PRIVATE_KEY === undefined) {
    throw new Error(
      `TEST_VINCENT_APP_MANAGER_PRIVATE_KEY environment variable is not set. Please set it to the private key that will be used to create the test Vincent App.`,
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

  const tx = await vincentContract.registerApp(
    // AppInfo struct
    {
      name: TEST_VINCENT_APP_NAME,
      description: TEST_VINCENT_APP_DESCRIPTION,
      deploymentStatus: 0, // DEV
      authorizedRedirectUris: TEST_VINCENT_APP_AUTHORIZED_REDIRECT_URIS,
      delegatees: [],
    },
    // VersionTools struct
    {
      toolIpfsCids: TOOL_IPFS_IDS,
      toolPolicies: TOOL_POLICIES,
      toolPolicyParameterNames: TOOL_POLICY_PARAMETER_NAMES,
      toolPolicyParameterTypes: TOOL_POLICY_PARAMETER_TYPES,
    },
  );

  const txReceipt = await tx.wait();

  // Parse the NewAppRegistered event to get the app ID
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

  const newAppRegisteredLog = parsedLogs.find((log: any) => log?.name === 'NewAppRegistered');
  if (!newAppRegisteredLog) {
    throw new Error('NewAppRegistered event not found in transaction logs');
  }

  const newAppId = newAppRegisteredLog.args.appId as ethers.BigNumber;
  const newAppVersion = 1; // First version is always 1

  return {
    appId: newAppId.toNumber(),
    appVersion: newAppVersion,
  };
};
