import { ethers } from 'ethers';
import { getErc20Contract } from '../helpers';
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
  tokenAddress,
}: {
  rpcUrl: string;
  chainId: number;
  pkpEthAddress: string;
  pkpPublicKey: string;
  spenderAddress: string;
  tokenAmount: bigint;
  tokenAddress: string;
}) => {
  console.log('sendErc20ApprovalTx', {
    rpcUrl,
    chainId,
    pkpEthAddress,
    pkpPublicKey,
    spenderAddress,
    tokenAmount: tokenAmount.toString(),
    tokenAddress,
  });

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const contract = getErc20Contract(tokenAddress, provider);

  // Convert bigint to ethers.BigNumber for proper encoding
  const tokenAmountBN = ethers.BigNumber.from(tokenAmount.toString());

  // Encode the approve function call
  const approveTxData = contract.interface.encodeFunctionData('approve', [
    spenderAddress,
    tokenAmountBN,
  ]);

  const txMetadataResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'estimateGas' },
    async () => {
      try {
        const [feeData, gasLimit, nonce] = await Promise.all([
          provider.getFeeData(),
          provider.estimateGas({
            from: pkpEthAddress,
            to: tokenAddress,
            data: approveTxData,
          }),
          provider.getTransactionCount(pkpEthAddress),
        ]);

        return JSON.stringify({
          status: 'success',
          maxFeePerGas: feeData.maxFeePerGas?.toString() || '0',
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString() || '0',
          gas: gasLimit.toString(),
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

  console.log(
    'parsedTxMetadataResponse (sendErc20ApprovalTx)',
    JSON.stringify(parsedTxMetadataResponse),
  );

  const { maxFeePerGas, maxPriorityFeePerGas, gas, nonce } = parsedTxMetadataResponse;

  const unsignedApproveTx: ethers.Transaction = {
    to: tokenAddress,
    data: approveTxData,
    value: ethers.BigNumber.from(0),
    gasLimit: ethers.BigNumber.from(gas),
    maxFeePerGas: ethers.BigNumber.from(maxFeePerGas),
    maxPriorityFeePerGas: ethers.BigNumber.from(maxPriorityFeePerGas),
    nonce,
    chainId,
    type: 2, // EIP-1559 transaction type
  };

  const signedApproveTx = await signTx(pkpPublicKey, unsignedApproveTx, 'approveErc20Sig');

  console.log('signedApproveTx (sendErc20ApprovalTx)', signedApproveTx);

  const erc20ApproveTxResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'spendTxSender' },
    async () => {
      try {
        const txResponse = await provider.sendTransaction(signedApproveTx);
        return JSON.stringify({
          status: 'success',
          txHash: txResponse.hash,
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
    throw new Error(`Error sending approval transaction: ${parsedErc20ApproveTxResponse.error}`);
  }

  return parsedErc20ApproveTxResponse.txHash;
};
