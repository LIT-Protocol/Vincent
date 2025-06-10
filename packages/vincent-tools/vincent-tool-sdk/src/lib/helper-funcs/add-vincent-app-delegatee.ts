import { LIT_NETWORK, RPC_URL_BY_NETWORK } from '@lit-protocol/constants';
import { ethers } from 'ethers';

const VINCENT_CONTRACT_ABI = [
  'function addDelegatee(uint256 appId, address delegatee)',
  'event DelegateeAdded(uint256 indexed appId, address indexed delegatee)',
];

export const addVincentAppDelegatee = async ({
  vincentAddress,
  vincentAppManagerEthersWallet,
  appId,
  delegateeAddress,
}: {
  vincentAddress: string;
  vincentAppManagerEthersWallet: ethers.Wallet;
  appId: number;
  delegateeAddress: string;
}): Promise<{ appId: number; delegateeAddress: string; txHash: string }> => {
  const provider = new ethers.providers.StaticJsonRpcProvider(
    RPC_URL_BY_NETWORK[LIT_NETWORK.Datil],
  );
  const connectedWallet = vincentAppManagerEthersWallet.connect(provider);
  const vincentContract = new ethers.Contract(
    vincentAddress,
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

  return {
    appId,
    delegateeAddress: delegateeAddedLog.args.delegatee as string,
    txHash: txReceipt.transactionHash,
  };
};
