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

export const sendAerodromeSwapTx = async ({
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
    console.log('[sendAerodromeSwapTx] Alchemy gas sponsor is enabled');

    if (!alchemyGasSponsorApiKey || !alchemyGasSponsorPolicyId) {
      throw new Error(
        '[sendAerodromeSwapTx] Alchemy gas sponsor is enabled, but API key or policy ID is not provided.',
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

  console.log('Estimating gas for Aerodrome swap transaction (sendAerodromeSwapTx)');

  const populateTxResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'Aerodrome swap tx gas estimation' },
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
      `[sendAerodromeSwapTx] Error populating transaction for swap: ${parsedPopulateTxResponse.error}`,
    );
  }
  const { populatedTransaction }: { populatedTransaction: UnsignedTransaction } =
    parsedPopulateTxResponse;

  const signedSwapTx = await signTx(pkpPublicKey, populatedTransaction, 'aerodromeSwapSig');

  console.log(`Broadcasting Aerodrome swap transaction (sendAerodromeSwapTx)`);
  const swapTxResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'aerodromeSwapTxSender' },
    async () => {
      try {
        const rpcProvider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);
        const receipt = await rpcProvider.sendTransaction(signedSwapTx);
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
      `Error broadcasting Aerodrome swap transaction: ${parsedSwapTxResponse.error} (sendAerodromeSwapTx)`,
    );
  }
  const { txHash } = parsedSwapTxResponse;
  console.log(`Aerodrome swap transaction broadcasted (sendAerodromeSwapTx): ${txHash}`);

  return txHash;
};
