import { LIT_NETWORK, RPC_URL_BY_NETWORK } from '@lit-protocol/constants';
import { ethers } from 'ethers';

import { getEnv } from './get-env';
import { checkNativeTokenBalance } from './check-native-balance';

const VINCENT_CONTRACT_ABI = [
  'function unpermitAppVersion(uint256 pkpTokenId, uint256 appId, uint256 appVersion)',
  'event AppVersionUnpermitted(uint256 indexed pkpTokenId, uint256 indexed appId, uint256 indexed appVersion)',
];

export const unpermitVincentAppVersion = async ({
  pkpTokenId,
  appId,
  appVersion,
  pkpOwnerPrivateKey,
}: {
  pkpTokenId: string;
  appId: number;
  appVersion: number;
  pkpOwnerPrivateKey: string;
}) => {
  const VINCENT_ADDRESS = getEnv('VINCENT_ADDRESS');
  if (VINCENT_ADDRESS === undefined) {
    throw new Error(
      `VINCENT_ADDRESS environment variable is not set. Please set it to the address of the Vincent contract.`,
    );
  }

  const pkpOwnerWallet = new ethers.Wallet(pkpOwnerPrivateKey);

  const MIN_ETH_BALANCE = ethers.utils.parseEther('0.01');
  const { balance, hasMinBalance } = await checkNativeTokenBalance({
    ethAddress: pkpOwnerWallet.address,
    rpcUrl: RPC_URL_BY_NETWORK[LIT_NETWORK.Datil],
    minBalance: MIN_ETH_BALANCE,
  });
  if (!hasMinBalance) {
    throw new Error(
      `PKP Owner (${pkpOwnerWallet.address}) doesn't have the minimum required balance of ${ethers.utils.formatEther(MIN_ETH_BALANCE)} ETH on the Lit Datil network. Current balance is ${ethers.utils.formatEther(balance)} ETH. Please fund the PKP Owner before continuing using the Lit test token faucet: https://chronicle-yellowstone-faucet.getlit.dev/.`,
    );
  }

  const provider = new ethers.providers.StaticJsonRpcProvider(
    RPC_URL_BY_NETWORK[LIT_NETWORK.Datil],
  );
  const connectedWallet = pkpOwnerWallet.connect(provider);
  const vincentContract = new ethers.Contract(
    VINCENT_ADDRESS,
    VINCENT_CONTRACT_ABI,
    connectedWallet,
  );

  const tx = await vincentContract.unpermitAppVersion(pkpTokenId, appId, appVersion);

  const txReceipt = await tx.wait();

  // Parse the AppVersionUnpermitted event to confirm the unpermit
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

  const appVersionUnpermittedLog = parsedLogs.find(
    (log: any) => log?.name === 'AppVersionUnpermitted',
  );
  if (!appVersionUnpermittedLog) {
    throw new Error('AppVersionUnpermitted event not found in transaction logs');
  }

  // Verify the event matches our request
  const eventPkpTokenId = appVersionUnpermittedLog.args.pkpTokenId as ethers.BigNumber;
  const eventAppId = appVersionUnpermittedLog.args.appId as ethers.BigNumber;
  const eventAppVersion = appVersionUnpermittedLog.args.appVersion as ethers.BigNumber;

  if (
    eventPkpTokenId.toString() !== pkpTokenId ||
    eventAppId.toNumber() !== appId ||
    eventAppVersion.toNumber() !== appVersion
  ) {
    throw new Error(
      `Event data doesn't match request. Expected PKP: ${pkpTokenId}, App: ${appId}, Version: ${appVersion}. Got PKP: ${eventPkpTokenId.toString()}, App: ${eventAppId.toNumber()}, Version: ${eventAppVersion.toNumber()}`,
    );
  }

  return {
    txHash: tx.hash,
    pkpTokenId: eventPkpTokenId.toString(),
    appId: eventAppId.toNumber(),
    appVersion: eventAppVersion.toNumber(),
  };
};
