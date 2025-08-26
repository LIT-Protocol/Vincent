import { ethers } from 'ethers';

import { signTx } from './sign-tx';
import { getGasParams } from './get-gas-params';

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

export const sendUniswapTxWithRoute = async ({
  rpcUrl,
  chainId,
  pkpEthAddress,
  pkpPublicKey,
  route,
}: {
  rpcUrl: string;
  chainId: number;
  pkpEthAddress: `0x${string}`;
  pkpPublicKey: string;
  route: {
    to: string;
    calldata: string;
    estimatedGasUsed: string;
  };
}): Promise<`0x${string}`> => {
  console.log(
    'Estimating gas for Swap transaction using pre-computed route (sendUniswapTxWithRoute)',
  );

  const uniswapRpcProvider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);

  const partialSwapTxResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'Uniswap swap tx gas estimation with pre-computed route' },
    async () => {
      try {
        console.log('Using pre-computed Uniswap route for swap (sendUniswapTxWithRoute)');

        // Use getGasParams helper which handles block/feeData fetching and applies 50% buffer
        const { estimatedGas, maxFeePerGas, maxPriorityFeePerGas } = await getGasParams(
          uniswapRpcProvider,
          ethers.BigNumber.from(route.estimatedGasUsed),
        );

        console.log('Swap transaction details with pre-computed route (sendUniswapTxWithRoute)', {
          to: route.to,
          calldata: route.calldata,
          routeEstimatedGas: route.estimatedGasUsed,
          adjustedGasLimit: estimatedGas.toString(),
          maxPriorityFeePerGas: `${ethers.utils.formatUnits(maxPriorityFeePerGas, 'gwei')} gwei`,
          maxFeePerGas: `${ethers.utils.formatUnits(maxFeePerGas, 'gwei')} gwei`,
        });

        return JSON.stringify({
          status: 'success',
          partialSwapTx: {
            to: route.to,
            data: route.calldata,
            gasLimit: estimatedGas.toString(),
            maxFeePerGas: maxFeePerGas.toString(),
            maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
            nonce: await uniswapRpcProvider.getTransactionCount(pkpEthAddress),
          },
        });
      } catch (error) {
        return JSON.stringify({
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  const parsedPartialSwapTxResponse = JSON.parse(partialSwapTxResponse);
  if (parsedPartialSwapTxResponse.status === 'error') {
    throw new Error(
      `Error getting transaction data for swap: ${parsedPartialSwapTxResponse.error} (sendUniswapTxWithRoute)`,
    );
  }
  const { partialSwapTx } = parsedPartialSwapTxResponse;

  const unsignedSwapTx = {
    to: partialSwapTx.to,
    data: partialSwapTx.data,
    value: ethers.BigNumber.from(0),
    gasLimit: ethers.BigNumber.from(partialSwapTx.gasLimit),
    maxFeePerGas: ethers.BigNumber.from(partialSwapTx.maxFeePerGas),
    maxPriorityFeePerGas: ethers.BigNumber.from(partialSwapTx.maxPriorityFeePerGas),
    nonce: partialSwapTx.nonce,
    chainId,
    type: 2,
  };
  console.log('Unsigned swap transaction object with pre-computed route (sendUniswapTxWithRoute)', {
    ...unsignedSwapTx,
    value: unsignedSwapTx.value.toString(),
    gasLimit: unsignedSwapTx.gasLimit.toString(),
    maxFeePerGas: unsignedSwapTx.maxFeePerGas.toString(),
    maxPriorityFeePerGas: unsignedSwapTx.maxPriorityFeePerGas.toString(),
  });

  const signedSwapTx = await signTx(pkpPublicKey, unsignedSwapTx, 'spendingLimitSig');

  console.log(`Broadcasting swap transaction with pre-computed route (sendUniswapTxWithRoute)`);
  const swapTxResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'swapTxSender' },
    async () => {
      try {
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
      `Error broadcasting swap transaction: ${parsedSwapTxResponse.error} (sendUniswapTxWithRoute)`,
    );
  }
  const { txHash } = parsedSwapTxResponse;
  console.log(
    `Swap transaction broadcasted with pre-computed route (sendUniswapTxWithRoute): ${txHash}`,
  );

  return txHash;
};
