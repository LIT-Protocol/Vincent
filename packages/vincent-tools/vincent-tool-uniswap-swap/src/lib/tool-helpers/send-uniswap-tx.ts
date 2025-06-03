import { createPublicClient, http, parseUnits } from 'viem';
import { Route, SwapRouter, Trade } from '@uniswap/v3-sdk';
import {
  CHAIN_TO_ADDRESSES_MAP,
  CurrencyAmount,
  Percent,
  SWAP_ROUTER_02_ADDRESSES,
  Token,
  TradeType,
} from '@uniswap/sdk-core';

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
  tokenInDecimals,
  tokenInAmount,
  pkpPublicKey,
  uniswapSwapRoute,
  uniswapTokenIn,
  uniswapTokenOut,
  swapQuote,
  slippageTolerance,
  swapDeadline,
}: {
  rpcUrl: string;
  chainId: number;
  pkpEthAddress: `0x${string}`;
  tokenInDecimals: number;
  tokenInAmount: number;
  pkpPublicKey: string;
  uniswapSwapRoute: Route<Token, Token>;
  uniswapTokenIn: Token;
  uniswapTokenOut: Token;
  swapQuote: bigint;
  slippageTolerance: Percent;
  swapDeadline: bigint;
}): Promise<`0x${string}`> => {
  if (CHAIN_TO_ADDRESSES_MAP[chainId as keyof typeof CHAIN_TO_ADDRESSES_MAP] === undefined) {
    throw new Error(`Unsupported chainId: ${chainId} (sendUniswapTx)`);
  }

  const uncheckedTrade = Trade.createUncheckedTrade({
    route: uniswapSwapRoute,
    inputAmount: CurrencyAmount.fromRawAmount(
      uniswapTokenIn,
      parseUnits(tokenInAmount.toString(), tokenInDecimals).toString(),
    ),
    outputAmount: CurrencyAmount.fromRawAmount(uniswapTokenOut, swapQuote.toString()),
    tradeType: TradeType.EXACT_INPUT,
  });

  const swapCallParametersResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'getSwapCallParameters' },
    async () => {
      try {
        const methodParameters = SwapRouter.swapCallParameters([uncheckedTrade], {
          slippageTolerance,
          deadline: swapDeadline.toString(),
          recipient: pkpEthAddress as `0x${string}`,
        });

        return JSON.stringify({
          status: 'success',
          methodParameters,
        });
      } catch (error) {
        return JSON.stringify({
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  const parsedSwapCallParametersResponse = JSON.parse(swapCallParametersResponse as string);
  if (parsedSwapCallParametersResponse.status === 'error') {
    throw new Error(
      `Error getting swap call parameters: ${parsedSwapCallParametersResponse.error}`,
    );
  }
  const { methodParameters } = parsedSwapCallParametersResponse;

  const swapRouterAddress = SWAP_ROUTER_02_ADDRESSES(chainId) as `0x${string}`;
  console.log(`Using Swap Router Address: ${swapRouterAddress} (sendUniswapTx)`);

  const client = createPublicClient({
    transport: http(rpcUrl),
  });

  const txMetadataResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'estimateGas' },
    async () => {
      try {
        const [nonce, estimatedFeesPerGas] = await Promise.all([
          // client.estimateGas({
          //   account: pkpEthAddress as `0x${string}`,
          //   to: swapRouterAddress,
          //   data: methodParameters.calldata as `0x${string}`,
          // }),
          client.getTransactionCount({
            address: pkpEthAddress as `0x${string}`,
          }),
          client.estimateFeesPerGas(),
        ]);

        return JSON.stringify({
          status: 'success',
          maxFeePerGas: estimatedFeesPerGas.maxFeePerGas.toString(),
          maxPriorityFeePerGas: estimatedFeesPerGas.maxPriorityFeePerGas.toString(),
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
  const { nonce, maxFeePerGas, maxPriorityFeePerGas } = parsedTxMetadataResponse;

  const unsignedSwapTx = {
    to: swapRouterAddress,
    data: methodParameters.calldata as `0x${string}`,
    // value: BigInt(methodParameters.value),
    value: 0n,
    gas: 150_000n,
    maxFeePerGas: BigInt(maxFeePerGas),
    maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas),
    nonce,
    chainId,
    type: 'eip1559' as const,
  };

  const signedSwapTx = await signTx({
    pkpPublicKey,
    tx: unsignedSwapTx,
    sigName: 'uniswapSwapSig',
  });
  console.log('signedSwapTx (sendUniswapTx)', {
    signedSwapTx,
  });

  const swapTxResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'uniswapSwapTxSender' },
    async () => {
      try {
        const txHash = await client.sendRawTransaction({
          serializedTransaction: signedSwapTx as `0x${string}`,
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

  const parsedSwapTxResponse = JSON.parse(swapTxResponse as string);
  if (parsedSwapTxResponse.status === 'error') {
    throw new Error(`Error sending swap transaction: ${parsedSwapTxResponse.error}`);
  }

  return parsedSwapTxResponse.txHash;
};
