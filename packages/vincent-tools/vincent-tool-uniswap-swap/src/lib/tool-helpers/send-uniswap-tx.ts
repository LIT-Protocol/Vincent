import { CHAIN_TO_ADDRESSES_MAP } from '@uniswap/sdk-core';
import { ethers } from 'ethers';

import { estimateGasForSwap, getUniswapQuote, signTx } from '.';

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

  if (CHAIN_TO_ADDRESSES_MAP[chainId as keyof typeof CHAIN_TO_ADDRESSES_MAP] === undefined) {
    throw new Error(`Unsupported chainId: ${chainId} (sendUniswapTx)`);
  }

  const uniswapRouterAddress = CHAIN_TO_ADDRESSES_MAP[
    chainId as keyof typeof CHAIN_TO_ADDRESSES_MAP
  ].swapRouter02Address as `0x{string}`;
  const uniswapRpcProvider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);

  const partialSwapTxResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'Uniswap swap tx gas estimation' },
    async () => {
      try {
        const formattedTokenInAmount = ethers.utils.parseUnits(
          tokenInAmount.toString(),
          tokenInDecimals,
        );

        const uniswapV3RouterContract = new ethers.Contract(
          uniswapRouterAddress,
          [
            'function exactInputSingle((address,address,uint24,address,uint256,uint256,uint160)) external payable returns (uint256)',
          ],
          uniswapRpcProvider,
        );

        console.log('Getting Uniswap quote for swap (sendUniswapTx)');
        const uniswapQuoteResponse = await getUniswapQuote({
          rpcUrl,
          chainId,
          tokenInAddress,
          tokenInDecimals,
          tokenInAmount,
          tokenOutAddress,
          tokenOutDecimals,
        });

        const { bestFee, amountOutMin } = uniswapQuoteResponse;
        const { estimatedGas, maxFeePerGas, maxPriorityFeePerGas } = await estimateGasForSwap(
          uniswapV3RouterContract,
          tokenInAddress,
          tokenOutAddress,
          bestFee,
          pkpEthAddress,
          formattedTokenInAmount,
          amountOutMin,
        );

        console.log('Encoding swap transaction data (sendUniswapTx)', {
          tokenInAddress,
          tokenOutAddress,
          bestFee,
          pkpEthAddress,
          formattedTokenInAmount,
          amountOutMin,
          sqrtPriceLimitX96: 0,
        });
        const swapTxData = uniswapV3RouterContract.interface.encodeFunctionData(
          'exactInputSingle',
          [
            [
              tokenInAddress,
              tokenOutAddress,
              bestFee,
              pkpEthAddress,
              formattedTokenInAmount,
              amountOutMin,
              0,
            ],
          ],
        );

        return JSON.stringify({
          status: 'success',
          partialSwapTx: {
            data: swapTxData,
            gasLimit: estimatedGas,
            maxFeePerGas: maxFeePerGas,
            maxPriorityFeePerGas: maxPriorityFeePerGas,
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
    to: uniswapRouterAddress,
    data: partialSwapTx.data,
    value: ethers.BigNumber.from(0),
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
