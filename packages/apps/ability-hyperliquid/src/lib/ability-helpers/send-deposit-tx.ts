import { ethers, type UnsignedTransaction } from 'ethers';
import { populateTransaction, sponsoredGasRawTransaction } from '@lit-protocol/vincent-ability-sdk';

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

export const sendDepositTx = async ({
  rpcUrl,
  chainId,
  pkpEthAddress,
  pkpPublicKey,
  to,
  value,
  calldata,
  gasBufferPercentage,
  baseFeePerGasBufferPercentage,
  alchemyGasSponsor,
  alchemyGasSponsorApiKey,
  alchemyGasSponsorPolicyId,
}: {
  rpcUrl: string;
  chainId: number;
  pkpEthAddress: string;
  pkpPublicKey: string;
  to: string;
  value: string;
  calldata: string;
  gasBufferPercentage?: number;
  baseFeePerGasBufferPercentage?: number;
  alchemyGasSponsor?: boolean;
  alchemyGasSponsorApiKey?: string;
  alchemyGasSponsorPolicyId?: string;
}): Promise<string> => {
  if (alchemyGasSponsor) {
    console.log('[sendDepositTx] Alchemy gas sponsor is enabled');

    if (!alchemyGasSponsorApiKey || !alchemyGasSponsorPolicyId) {
      throw new Error(
        '[sendDepositTx] Alchemy gas sponsor is enabled, but API key or policy ID is not provided.',
      );
    }
    return await sponsoredGasRawTransaction({
      pkpPublicKey,
      to,
      value,
      data: calldata,
      chainId,
      eip7702AlchemyApiKey: alchemyGasSponsorApiKey,
      eip7702AlchemyPolicyId: alchemyGasSponsorPolicyId,
    });
  }

  console.log('[sendDepositTx] Estimating gas for Deposit transaction using pre-computed route');

  const populateTxResponse = await Lit.Actions.runOnce(
    {
      waitForResponse: true,
      name: '[sendDepositTx] Deposit tx gas estimation with pre-computed route',
    },
    async () => {
      try {
        return JSON.stringify({
          status: 'success',
          populatedTransaction: await populateTransaction({
            to,
            from: pkpEthAddress,
            value,
            data: calldata,
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
      `[sendDepositTx] Error populating transaction for deposit: ${parsedPopulateTxResponse.error}`,
    );
  }
  const { populatedTransaction }: { populatedTransaction: UnsignedTransaction } =
    parsedPopulateTxResponse;

  const signedSwapTx = await signTx(pkpPublicKey, populatedTransaction, 'depositTxSig');

  console.log(`[sendDepositTx] Broadcasting deposit transaction with pre-computed route`);
  const swapTxResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: '[sendDepositTx] Deposit tx sender' },
    async () => {
      try {
        const uniswapRpcProvider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);
        const receipt = await uniswapRpcProvider.sendTransaction(signedSwapTx);
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
      `[sendDepositTx] Error broadcasting deposit transaction: ${parsedSwapTxResponse.error}`,
    );
  }
  const { txHash } = parsedSwapTxResponse;
  console.log(`[sendDepositTx] Deposit transaction broadcasted with pre-computed route: ${txHash}`);

  return txHash;
};
