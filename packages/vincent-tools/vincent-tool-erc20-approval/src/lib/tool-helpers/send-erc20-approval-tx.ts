import { createPublicClient, encodeFunctionData, http, parseAbi, parseUnits } from 'viem';

import { signTx } from './sign-tx';

declare const Lit: {
  Actions: {
    runOnce: (
      params: {
        waitForResponse: boolean;
        name: string;
      },
      callback: () => Promise<unknown>,
    ) => Promise<unknown>;
  };
};

export const sendErc20ApprovalTx = async ({
  rpcUrl,
  chainId,
  pkpEthAddress,
  pkpPublicKey,
  spenderAddress,
  tokenAmount,
  tokenDecimals,
  tokenAddress,
}: {
  rpcUrl: string;
  chainId: number;
  pkpEthAddress: `0x${string}`;
  pkpPublicKey: string;
  spenderAddress: `0x${string}`;
  tokenAmount: bigint;
  tokenDecimals: number;
  tokenAddress: `0x${string}`;
}) => {
  console.log('sendErc20ApprovalTx', {
    rpcUrl,
    chainId,
    pkpEthAddress,
    pkpPublicKey,
    spenderAddress,
    tokenAmount: tokenAmount.toString(),
    tokenDecimals,
    tokenAddress,
  });

  const erc20Abi = parseAbi(['function approve(address spender, uint256 amount) returns (bool)']);

  const approveTxData = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'approve',
    args: [spenderAddress, parseUnits(tokenAmount.toString(), tokenDecimals)],
  });

  const client = createPublicClient({
    transport: http(rpcUrl),
  });

  const txMetadataResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'estimateGas' },
    async () => {
      try {
        const { maxFeePerGas, maxPriorityFeePerGas } = await client.estimateFeesPerGas();
        const gas = await client.estimateGas({
          account: pkpEthAddress as `0x${string}`,
          to: tokenAddress as `0x${string}`,
          data: approveTxData,
        });
        const nonce = await client.getTransactionCount({
          address: pkpEthAddress as `0x${string}`,
        });

        return JSON.stringify({
          status: 'success',
          maxFeePerGas: maxFeePerGas.toString(),
          maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
          gas: gas.toString(),
          nonce,
        });
      } catch (error) {
        return JSON.stringify({
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  const parsedTxMetadataResponse = JSON.parse(txMetadataResponse as string);
  if (parsedTxMetadataResponse.status === 'error') {
    throw new Error(`Error estimating gas: ${parsedTxMetadataResponse.error}`);
  }
  const { maxFeePerGas, maxPriorityFeePerGas, gas, nonce } = parsedTxMetadataResponse;

  const unsignedApproveTx = {
    to: tokenAddress as `0x${string}`,
    data: approveTxData,
    value: 0n,
    gas: BigInt(gas),
    maxFeePerGas: BigInt(maxFeePerGas),
    maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas),
    nonce,
    chainId,
    type: 'eip1559' as const,
  };

  console.log('unsignedApproveTx (sendErc20ApprovalTx)', unsignedApproveTx);

  const signedApproveTx = await signTx({
    pkpPublicKey,
    tx: unsignedApproveTx,
    sigName: 'approveErc20Sig',
  });

  console.log('signedApproveTx (sendErc20ApprovalTx)', signedApproveTx);

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

  console.log('erc20ApproveTxResponse (sendErc20ApprovalTx)', erc20ApproveTxResponse);

  const parsedErc20ApproveTxResponse = JSON.parse(erc20ApproveTxResponse as string);
  if (parsedErc20ApproveTxResponse.status === 'error') {
    throw new Error(`Error sending spend transaction: ${parsedErc20ApproveTxResponse.error}`);
  }

  return parsedErc20ApproveTxResponse.txHash;
};
