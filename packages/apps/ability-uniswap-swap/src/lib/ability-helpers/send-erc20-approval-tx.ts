import { ethers, type UnsignedTransaction } from 'ethers';
import { populateTransaction, sponsoredGasContractCall } from '@lit-protocol/vincent-ability-sdk';

import { ERC20_ABI } from './get-erc20-contract';
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
  pkpPublicKey,
  pkpEthAddress,
  erc20TokenAddress,
  spenderAddress,
  allowanceAmount,
  gasBufferPercentage,
  baseFeePerGasBufferPercentage,
  alchemyGasSponsor,
  alchemyGasSponsorApiKey,
  alchemyGasSponsorPolicyId,
}: {
  rpcUrl: string;
  chainId: number;
  pkpPublicKey: string;
  pkpEthAddress: string;
  erc20TokenAddress: string;
  spenderAddress: string;
  allowanceAmount: string;
  gasBufferPercentage?: number;
  baseFeePerGasBufferPercentage?: number;
  alchemyGasSponsor: boolean;
  alchemyGasSponsorApiKey?: string;
  alchemyGasSponsorPolicyId?: string;
}): Promise<string> => {
  if (alchemyGasSponsor) {
    console.log('[sendErc20ApprovalTx] Alchemy gas sponsor is enabled');

    if (!alchemyGasSponsorApiKey || !alchemyGasSponsorPolicyId) {
      throw new Error(
        '[sendErc20ApprovalTx] Alchemy gas sponsor is enabled, but API key or policy ID is not provided.',
      );
    }
    return await sponsoredGasContractCall({
      pkpPublicKey,
      abi: ERC20_ABI,
      contractAddress: erc20TokenAddress,
      functionName: 'approve',
      args: [spenderAddress, allowanceAmount],
      chainId,
      eip7702AlchemyApiKey: alchemyGasSponsorApiKey,
      eip7702AlchemyPolicyId: alchemyGasSponsorPolicyId,
    });
  }

  console.log('[sendErc20ApprovalTx] Estimating gas for ERC20 Approval transaction');
  const populateTxResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: '[sendErc20ApprovalTx] ERC20 approval tx gas estimation' },
    async () => {
      const erc20Interface = new ethers.utils.Interface(ERC20_ABI);
      const approveCalldata = erc20Interface.encodeFunctionData('approve', [
        spenderAddress,
        allowanceAmount,
      ]);

      try {
        return JSON.stringify({
          status: 'success',
          populatedTransaction: await populateTransaction({
            to: erc20TokenAddress,
            from: pkpEthAddress,
            value: '0',
            data: approveCalldata,
            rpcUrl,
            chainId,
            gasBufferPercentage,
            baseFeePerGasBufferPercentage,
          }),
        });
      } catch (error) {
        return JSON.stringify({
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  const parsedPopulateTxResponse = JSON.parse(populateTxResponse);
  if (parsedPopulateTxResponse.status === 'error') {
    throw new Error(
      `[sendErc20ApprovalTx] Error populating transaction for approval: ${parsedPopulateTxResponse.error}`,
    );
  }
  const { populatedTransaction }: { populatedTransaction: UnsignedTransaction } =
    parsedPopulateTxResponse;

  const signedApprovalTx = await signTx(pkpPublicKey, populatedTransaction, 'erc20ApprovalSig');

  console.log(`Broadcasting ERC20 approval transaction (sendErc20ApprovalTx)`);
  const swapTxResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'erc20ApprovalTxSender' },
    async () => {
      try {
        const uniswapRpcProvider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);
        const receipt = await uniswapRpcProvider.sendTransaction(signedApprovalTx);
        return JSON.stringify({
          status: 'success',
          txHash: receipt.hash,
        });
      } catch (error) {
        return JSON.stringify({
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  const parsedSwapTxResponse = JSON.parse(swapTxResponse);
  if (parsedSwapTxResponse.status === 'error') {
    throw new Error(
      `[sendErc20ApprovalTx] Error broadcasting ERC20 approval transaction: ${parsedSwapTxResponse.error}`,
    );
  }
  const { txHash } = parsedSwapTxResponse;
  console.log(`[sendErc20ApprovalTx] ERC20 approval transaction broadcasted: ${txHash}`);

  return txHash;
};
