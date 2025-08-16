import { ethers } from 'ethers';

import { getUniswapQuote } from './get-uniswap-quote';
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

export const sendUniswapTx = async ({
  rpcUrl,
  chainId,
  pkpEthAddress,
  pkpPublicKey,
  tokenInAddress,
  tokenOutAddress,
  tokenInDecimals,
  tokenOutDecimals,
  tokenInAmount,
}: {
  rpcUrl: string;
  chainId: number;
  pkpEthAddress: `0x${string}`;
  pkpPublicKey: string;
  tokenInAddress: `0x${string}`;
  tokenOutAddress: `0x${string}`;
  tokenInDecimals: number;
  tokenOutDecimals: number;
  tokenInAmount: number;
}): Promise<`0x${string}`> => {
  console.log('Estimating gas for Swap transaction (sendUniswapTx)');

  const uniswapRpcProvider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);

  const partialSwapTxResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'Uniswap swap tx gas estimation' },
    async () => {
      try {
        console.log('Getting Uniswap quote for swap (sendUniswapTx)');
        const uniswapQuoteResponse = await getUniswapQuote({
          rpcUrl,
          chainId,
          tokenInAddress,
          tokenInDecimals,
          tokenInAmount,
          tokenOutAddress,
          tokenOutDecimals,
          recipient: pkpEthAddress,
        });

        const { route } = uniswapQuoteResponse;

        if (!route || !route.methodParameters) {
          throw new Error('Failed to get valid route from Uniswap');
        }

        // Get gas estimates
        const gasPrice = await uniswapRpcProvider.getGasPrice();
        const maxPriorityFeePerGas = gasPrice.div(10); // 10% of gas price
        const maxFeePerGas = gasPrice.mul(2); // 2x gas price for safety

        // Use the gas estimate from the route
        const estimatedGas = route.estimatedGasUsed.add(route.estimatedGasUsed.div(10)); // Add 10% buffer

        console.log('Swap transaction details (sendUniswapTx)', {
          to: route.methodParameters.to,
          calldata: route.methodParameters.calldata,
          value: route.methodParameters.value,
          estimatedGas: estimatedGas.toString(),
        });

        return JSON.stringify({
          status: 'success',
          partialSwapTx: {
            to: route.methodParameters.to,
            data: route.methodParameters.calldata,
            value: route.methodParameters.value,
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
      `Error getting transaction data for swap: ${parsedPartialSwapTxResponse.error} (sendUniswapTx)`,
    );
  }
  const { partialSwapTx } = parsedPartialSwapTxResponse;

  const unsignedSwapTx = {
    to: partialSwapTx.to,
    data: partialSwapTx.data,
    value: ethers.BigNumber.from(partialSwapTx.value || 0),
    gasLimit: ethers.BigNumber.from(partialSwapTx.gasLimit),
    maxFeePerGas: ethers.BigNumber.from(partialSwapTx.maxFeePerGas),
    maxPriorityFeePerGas: ethers.BigNumber.from(partialSwapTx.maxPriorityFeePerGas),
    nonce: partialSwapTx.nonce,
    chainId,
    type: 2,
  };
  console.log('Unsigned swap transaction object (sendUniswapTx)', {
    ...unsignedSwapTx,
    value: unsignedSwapTx.value.toString(),
    gasLimit: unsignedSwapTx.gasLimit.toString(),
    maxFeePerGas: unsignedSwapTx.maxFeePerGas.toString(),
    maxPriorityFeePerGas: unsignedSwapTx.maxPriorityFeePerGas.toString(),
  });

  const signedSwapTx = await signTx(pkpPublicKey, unsignedSwapTx, 'spendingLimitSig');

  console.log(`Broadcasting swap transaction (sendUniswapTx)`);
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
      `Error broadcasting swap transaction: ${parsedSwapTxResponse.error} (sendUniswapTx)`,
    );
  }
  const { txHash } = parsedSwapTxResponse;
  console.log(`Swap transaction broadcasted (sendUniswapTx): ${txHash}`);

  return txHash;
};
