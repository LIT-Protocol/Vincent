import { LIT_NETWORK, RPC_URL_BY_NETWORK } from '@lit-protocol/constants';
import { ethers } from 'ethers';

import { getEnv } from './get-env';
import { checkNativeTokenBalance } from './check-native-balance';

const VINCENT_CONTRACT_ABI = [
  'function addDelegatee(uint256 appId, address delegatee)',
  'event DelegateeAdded(uint256 indexed appId, address indexed delegatee)',
];

export const addVincentAppDelegatee = async ({
  appId,
  delegateeAddress,
}: {
  appId: number;
  delegateeAddress: string;
}): Promise<{ appId: number; delegateeAddress: string; txHash: string }> => {
  const VINCENT_ADDRESS = getEnv('VINCENT_ADDRESS');
  if (VINCENT_ADDRESS === undefined) {
    throw new Error(
      `VINCENT_ADDRESS environment variable is not set. Please set it to the address of the Vincent contract.`,
    );
  }

  const TEST_VINCENT_APP_MANAGER_PRIVATE_KEY = getEnv('TEST_VINCENT_APP_MANAGER_PRIVATE_KEY');
  if (TEST_VINCENT_APP_MANAGER_PRIVATE_KEY === undefined) {
    throw new Error(
      `TEST_VINCENT_APP_MANAGER_PRIVATE_KEY environment variable is not set. Please set it to the private key that will be used to add the delegatee to the Vincent App.`,
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

  const tx = await vincentContract.addDelegatee(appId, delegateeAddress);
  const txReceipt = await tx.wait();

  // Parse the DelegateeAdded event to confirm the delegatee was added
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

  const delegateeAddedLog = parsedLogs.find((log: any) => log?.name === 'DelegateeAdded');
  if (!delegateeAddedLog) {
    throw new Error('DelegateeAdded event not found in transaction logs');
  }

  const addedAppId = delegateeAddedLog.args.appId as ethers.BigNumber;
  const addedDelegatee = delegateeAddedLog.args.delegatee as string;

  // Verify the event matches our request
  if (
    addedAppId.toNumber() !== appId ||
    addedDelegatee.toLowerCase() !== delegateeAddress.toLowerCase()
  ) {
    throw new Error(
      `Mismatch in DelegateeAdded event: expected appId ${appId} and delegatee ${delegateeAddress}, got appId ${addedAppId.toNumber()} and delegatee ${addedDelegatee}`,
    );
  }

  return {
    appId: addedAppId.toNumber(),
    delegateeAddress: addedDelegatee,
    txHash: txReceipt.transactionHash,
  };
};
