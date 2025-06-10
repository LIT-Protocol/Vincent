import { ethers } from 'ethers';
import { LIT_NETWORK, RPC_URL_BY_NETWORK } from '@lit-protocol/constants';

import { VincentAppToolsWithPolicies } from '../types';
import { getVincentContract } from '../../utils/get-vincent-contract';

const TEST_VINCENT_APP_NAME = 'Vincent Test App';
const TEST_VINCENT_APP_DESCRIPTION = 'A test app for the Vincent protocol';
const TEST_VINCENT_APP_AUTHORIZED_REDIRECT_URIS = ['https://testing.vincent.com'];

export const createVincentApp = async ({
  vincentAddress,
  vincentAppManagerEthersWallet,
  vincentAppToolsWithPolicies,
}: {
  vincentAddress: string;
  vincentAppManagerEthersWallet: ethers.Wallet;
  vincentAppToolsWithPolicies: VincentAppToolsWithPolicies[];
}) => {
  const yellowstoneEthersProvider = new ethers.providers.StaticJsonRpcProvider(
    RPC_URL_BY_NETWORK[LIT_NETWORK.Datil],
  );
  const MIN_ETH_BALANCE = ethers.utils.parseEther('0.01');
  const balance = await yellowstoneEthersProvider.getBalance(vincentAppManagerEthersWallet.address);

  if (balance.lt(MIN_ETH_BALANCE)) {
    console.error(
      `❌ App Manager (${vincentAppManagerEthersWallet.address}) doesn't have the minimum required balance of ${ethers.utils.formatEther(MIN_ETH_BALANCE)} Lit test tokens on the Lit Datil network. Current balance is ${ethers.utils.formatEther(balance)}. Please fund the App Manager before continuing using the Lit test token faucet: https://chronicle-yellowstone-faucet.getlit.dev/.`,
    );
    process.exit(1);
  }

  const vincentAppManagerWallWithProvider =
    vincentAppManagerEthersWallet.connect(yellowstoneEthersProvider);
  const vincentContract = await getVincentContract({
    vincentAddress,
    ethersWallet: vincentAppManagerWallWithProvider,
  });

  // Extract tool configurations from vincentAppToolsWithPolicies parameter
  const toolIpfsCids = vincentAppToolsWithPolicies.map((tool) => tool.ipfsCid);
  const toolPolicies = vincentAppToolsWithPolicies.map((tool) =>
    tool.policies.map((policy) => policy.ipfsCid),
  );
  const toolPolicyParameterNames = vincentAppToolsWithPolicies.map((tool) =>
    tool.policies.map((policy) => policy.parameterNames),
  );
  const toolPolicyParameterTypes = vincentAppToolsWithPolicies.map((tool) =>
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
      toolIpfsCids: toolIpfsCids,
      toolPolicies: toolPolicies,
      toolPolicyParameterNames: toolPolicyParameterNames,
      toolPolicyParameterTypes: toolPolicyParameterTypes,
    },
  );
  const txReceipt = await tx.wait();

  return {
    appId: parseAppIdFromTxReceipt({ vincentContract, txReceipt }),
    appVersion: 1, // First version is always 1
  };
};

const parseAppIdFromTxReceipt = ({
  vincentContract,
  txReceipt,
}: {
  vincentContract: ethers.Contract;
  txReceipt: ethers.ContractReceipt;
}) => {
  // Parse the NewAppRegistered event to get the app ID
  const vincentInterface = vincentContract.interface;
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

  return (newAppRegisteredLog.args.appId as ethers.BigNumber).toNumber();
};
