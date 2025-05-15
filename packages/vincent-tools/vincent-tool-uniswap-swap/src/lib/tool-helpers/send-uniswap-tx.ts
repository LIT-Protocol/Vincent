import { createPublicClient, http, parseUnits } from 'viem';
import { z } from 'zod';
import { Route, SwapRouter, Trade } from '@uniswap/v3-sdk';
import { CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core';

import { UniswapSwapToolParamsSchema } from '../vincent-tool';
import { signTx } from './sign-tx';
import { createChronicleYellowstoneViemClient } from './viem-chronicle-yellowstone-client';

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

const ETH_MAINNET_SWAP_ROUTER_CONTRACT_ADDRESS = '0xE592427A0AEce92De3Edee1F18E0157C05861564';

export const sendUniswapTx = async ({
  toolParams,
  pkpPublicKey,
  uniswapSwapRoute,
  uniswapTokenIn,
  uniswapTokenOut,
  swapQuote,
  slippageTolerance,
  swapDeadline,
}: {
  toolParams: z.infer<typeof UniswapSwapToolParamsSchema>;
  pkpPublicKey: string;
  uniswapSwapRoute: Route<Token, Token>;
  uniswapTokenIn: Token;
  uniswapTokenOut: Token;
  swapQuote: bigint;
  slippageTolerance: Percent;
  swapDeadline: bigint;
}): Promise<`0x${string}`> => {
  const { ethRpcUrl, pkpEthAddress, tokenInDecimals, tokenInAmount } = toolParams;

  const client = createPublicClient({
    transport: http(ethRpcUrl),
  });

  const uncheckedTrade = Trade.createUncheckedTrade({
    route: uniswapSwapRoute,
    inputAmount: CurrencyAmount.fromRawAmount(
      uniswapTokenIn,
      parseUnits(tokenInAmount.toString(), tokenInDecimals).toString(),
    ),
    outputAmount: CurrencyAmount.fromRawAmount(uniswapTokenOut, swapQuote.toString()),
    tradeType: TradeType.EXACT_INPUT,
  });

  const methodParameters = SwapRouter.swapCallParameters([uncheckedTrade], {
    slippageTolerance,
    deadline: swapDeadline.toString(),
    recipient: pkpEthAddress as `0x${string}`,
  });

  const { maxFeePerGas, maxPriorityFeePerGas } = await client.estimateFeesPerGas();
  const unsignedSwapTx = {
    to: ETH_MAINNET_SWAP_ROUTER_CONTRACT_ADDRESS as `0x${string}`,
    data: methodParameters.calldata as `0x${string}`,
    value: BigInt(methodParameters.value),
    gas: await client.estimateGas({
      account: pkpEthAddress as `0x${string}`,
      to: ETH_MAINNET_SWAP_ROUTER_CONTRACT_ADDRESS,
      data: methodParameters.calldata as `0x${string}`,
    }),
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce: await client.getTransactionCount({
      address: pkpEthAddress as `0x${string}`,
    }),
    chainId: 1,
    type: 'eip1559' as const,
  };

  const signedSwapTx = await signTx({
    pkpPublicKey,
    tx: unsignedSwapTx,
    sigName: 'uniswapSwapSig',
  });

  const swapTxResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'spendTxSender' },
    async () => {
      try {
        const chronicleYellowstoneProvider = createChronicleYellowstoneViemClient();
        const txHash = await chronicleYellowstoneProvider.sendRawTransaction({
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
    throw new Error(`Error sending spend transaction: ${parsedSwapTxResponse.error}`);
  }

  return parsedSwapTxResponse.txHash;
};
