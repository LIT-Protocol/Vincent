import { CHAIN_TO_ADDRESSES_MAP, Currency } from '@uniswap/sdk-core';
import { ethers } from 'ethers';
import { encodeRouteToPath, Route } from '@uniswap/v3-sdk';

import { getUniswapQuote, signTx } from '.';

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

export const sendUniswapMultihopTx = async ({
  rpcUrl,
  chainId,
  pkpEthAddress,
  pkpPublicKey,
  tokenInAddress,
  tokenOutAddress,
  tokenInDecimals,
  tokenOutDecimals,
  tokenInAmount,
  path,
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
  path: Array<{ tokenAddress: string; fee: number }>;
}): Promise<`0x${string}`> => {
  console.log('Estimating gas for multihop Swap transaction (sendUniswapMultihopTx)');

  if (CHAIN_TO_ADDRESSES_MAP[chainId as keyof typeof CHAIN_TO_ADDRESSES_MAP] === undefined) {
    throw new Error(`Unsupported chainId: ${chainId} (sendUniswapMultihopTx)`);
  }

  const uniswapRouterAddress = CHAIN_TO_ADDRESSES_MAP[
    chainId as keyof typeof CHAIN_TO_ADDRESSES_MAP
  ].swapRouter02Address as `0x{string}`;
  const uniswapRpcProvider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);

  const partialSwapTxResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'Uniswap multihop swap tx gas estimation' },
    async () => {
      try {
        const formattedTokenInAmount = ethers.utils.parseUnits(
          tokenInAmount.toString(),
          tokenInDecimals,
        );

        const uniswapV3RouterContract = new ethers.Contract(
          uniswapRouterAddress,
          [
            'function exactInput((bytes,address,uint256,uint256,uint256)) external payable returns (uint256)',
          ],
          uniswapRpcProvider,
        );

        // Build the encoded path for multihop
        const tokens: Route<Currency, Currency>[] = [tokenInAddress];
        const fees: number[] = [];

        for (const hop of path) {
          tokens.push(hop.tokenAddress);
          fees.push(hop.fee);
        }
        tokens.push(tokenOutAddress);

        // Encode the path using Uniswap V3 SDK
        const encodedPath = encodeRouteToPath(tokens, fees);

        console.log('Getting Uniswap quote for multihop swap (sendUniswapMultihopTx)', {
          path: tokens,
          fees,
        });

        // For multihop, we'll use the final token for quote estimation
        // In production, you might want to implement a more sophisticated quoting system
        const uniswapQuoteResponse = await getUniswapQuote({
          rpcUrl,
          chainId,
          tokenInAddress,
          tokenInDecimals,
          tokenInAmount,
          tokenOutAddress,
          tokenOutDecimals,
        });

        const { amountOutMin } = uniswapQuoteResponse;

        // Estimate gas for multihop swap
        const gasEstimate = await uniswapV3RouterContract.estimateGas.exactInput([
          encodedPath,
          pkpEthAddress,
          Math.floor(Date.now() / 1000) + 1800, // 30 minutes deadline
          formattedTokenInAmount,
          amountOutMin,
        ]);

        const feeData = await uniswapRpcProvider.getFeeData();
        const maxFeePerGas = feeData.maxFeePerGas?.toString() || '0';
        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas?.toString() || '0';

        console.log('Encoding multihop swap transaction data (sendUniswapMultihopTx)', {
          encodedPath,
          pkpEthAddress,
          formattedTokenInAmount,
          amountOutMin,
        });

        const swapTxData = uniswapV3RouterContract.interface.encodeFunctionData('exactInput', [
          [
            encodedPath,
            pkpEthAddress,
            Math.floor(Date.now() / 1000) + 1800, // 30 minutes deadline
            formattedTokenInAmount,
            amountOutMin,
          ],
        ]);

        return JSON.stringify({
          status: 'success',
          partialSwapTx: {
            data: swapTxData,
            gasLimit: gasEstimate.toString(),
            maxFeePerGas,
            maxPriorityFeePerGas,
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
      `Error getting transaction data for multihop swap: ${parsedPartialSwapTxResponse.error} (sendUniswapMultihopTx)`,
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

  console.log('Unsigned multihop swap transaction object (sendUniswapMultihopTx)', {
    ...unsignedSwapTx,
    value: unsignedSwapTx.value.toString(),
    gasLimit: unsignedSwapTx.gasLimit.toString(),
    maxFeePerGas: unsignedSwapTx.maxFeePerGas.toString(),
    maxPriorityFeePerGas: unsignedSwapTx.maxPriorityFeePerGas.toString(),
  });

  const signedSwapTx = await signTx(pkpPublicKey, unsignedSwapTx, 'spendingLimitSig');

  console.log(`Broadcasting multihop swap transaction (sendUniswapMultihopTx)`);
  const swapTxResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'multihopSwapTxSender' },
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
      `Error broadcasting multihop swap transaction: ${parsedSwapTxResponse.error} (sendUniswapMultihopTx)`,
    );
  }
  const { txHash } = parsedSwapTxResponse;
  console.log(`Multihop swap transaction broadcasted (sendUniswapMultihopTx): ${txHash}`);

  return txHash;
};
