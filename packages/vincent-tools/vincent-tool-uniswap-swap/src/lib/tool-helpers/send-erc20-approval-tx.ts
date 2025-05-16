import { createPublicClient, encodeFunctionData, http, parseAbi, parseUnits } from 'viem';
import { CHAIN_TO_ADDRESSES_MAP } from '@uniswap/sdk-core';

import { signTx } from './sign-tx';

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

export const sendErc20ApprovalTx = async ({
  rpcUrl,
  chainId,
  tokenInAmount,
  tokenInDecimals,
  tokenInAddress,
  pkpEthAddress,
  pkpPublicKey,
}: {
  rpcUrl: string;
  chainId: number;
  tokenInAmount: bigint;
  tokenInDecimals: number;
  tokenInAddress: `0x${string}`;
  pkpEthAddress: `0x${string}`;
  pkpPublicKey: string;
}) => {
  if (CHAIN_TO_ADDRESSES_MAP[chainId as keyof typeof CHAIN_TO_ADDRESSES_MAP] === undefined) {
    throw new Error(`Unsupported chainId: ${chainId} (sendErc20ApprovalTx)`);
  }

  const erc20Abi = parseAbi(['function approve(address spender, uint256 amount) returns (bool)']);

  const approveTxData = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'approve',
    args: [
      CHAIN_TO_ADDRESSES_MAP[chainId as keyof typeof CHAIN_TO_ADDRESSES_MAP]
        .quoterAddress as `0x${string}`,
      parseUnits(tokenInAmount.toString(), tokenInDecimals),
    ],
  });

  const client = createPublicClient({
    transport: http(rpcUrl),
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
    chainId,
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
        const txHash = await client.sendRawTransaction({
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
