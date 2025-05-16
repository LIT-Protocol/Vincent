import { createPublicClient, encodeFunctionData, http, parseAbi, parseUnits } from 'viem';
import { signTx } from './sign-tx';
import { createChronicleYellowstoneViemClient } from './viem-chronicle-yellowstone-client';

declare const Lit: {
  Actions: {
    runOnce: (
      params: {
        waitForResponse: boolean;
        name: string;
      },
      callback: () => Promise<string>,
    ) => Promise<string>;
  };
};

const ETH_MAINNET_QUOTER_CONTRACT_ADDRESS = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';

export const sendErc20ApprovalTx = async ({
  ethRpcUrl,
  tokenInAmount,
  tokenInDecimals,
  tokenInAddress,
  pkpEthAddress,
  pkpPublicKey,
}: {
  ethRpcUrl: string;
  tokenInAmount: bigint;
  tokenInDecimals: number;
  tokenInAddress: `0x${string}`;
  pkpEthAddress: `0x${string}`;
  pkpPublicKey: string;
}) => {
  const erc20Abi = parseAbi(['function approve(address spender, uint256 amount) returns (bool)']);

  const approveTxData = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'approve',
    args: [
      ETH_MAINNET_QUOTER_CONTRACT_ADDRESS,
      parseUnits(tokenInAmount.toString(), tokenInDecimals),
    ],
  });

  const client = createPublicClient({
    transport: http(ethRpcUrl),
  });

  const { maxFeePerGas, maxPriorityFeePerGas } = await client.estimateFeesPerGas();

  const unsignedApproveTx = {
    to: tokenInAddress as `0x${string}`,
    data: approveTxData,
    value: 0n,
    gas: await client.estimateGas({
      account: pkpEthAddress as `0x${string}`,
      to: tokenInAddress as `0x${string}`,
      data: approveTxData,
    }),
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce: await client.getTransactionCount({
      address: pkpEthAddress as `0x${string}`,
    }),
    chainId: 1,
    type: 'eip1559' as const,
  };

  const signedApproveTx = await signTx({
    pkpPublicKey,
    tx: unsignedApproveTx,
    sigName: 'approveErc20Sig',
  });

  const erc20ApproveTxResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'spendTxSender' },
    async () => {
      try {
        const chronicleYellowstoneProvider = createChronicleYellowstoneViemClient();
        const txHash = await chronicleYellowstoneProvider.sendRawTransaction({
          serializedTransaction: signedApproveTx as `0x${string}`,
        });
        return JSON.stringify({
          status: 'success',
          txHash,
        });
      } catch (error: unknown) {
        return JSON.stringify({
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  const parsedErc20ApproveTxResponse = JSON.parse(erc20ApproveTxResponse as string);
  if (parsedErc20ApproveTxResponse.status === 'error') {
    throw new Error(`Error sending spend transaction: ${parsedErc20ApproveTxResponse.error}`);
  }

  return parsedErc20ApproveTxResponse.txHash;
};
