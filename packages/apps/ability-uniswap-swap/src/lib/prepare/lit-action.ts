import deterministicJsonStringify from 'json-stable-stringify';

import { getUniswapQuote } from '../ability-helpers/get-uniswap-quote';
import type { QuoteParams, PrepareSuccessResponse, PrepareErrorResponse } from './types';

declare const Lit: {
  Actions: {
    setResponse: (response: { response: string }) => void;
    getRpcUrl: (args: { chain: string }) => Promise<string>;
    ethPersonalSignMessageEcdsa: (args: {
      message: string;
      publicKey: string;
      sigName: string;
    }) => Promise<string>;
    runOnce: (
      params: {
        waitForResponse: boolean;
        name: string;
      },
      callback: () => Promise<string>,
    ) => Promise<string>;
  };
};

declare const quoteParams: QuoteParams;
declare const pkpPublicKey: string;

(async () => {
  try {
    console.log('Quote parameters:', quoteParams);

    const quoteResponse = await Lit.Actions.runOnce(
      { waitForResponse: true, name: 'Uniswap quote' },
      async () => {
        try {
          const quoteResult = await getUniswapQuote(quoteParams);

          if (!quoteResult.methodParameters) {
            throw new Error('No method parameters returned from quote');
          }

          return JSON.stringify({
            status: 'success',
            quoteResult: {
              chainId: quoteResult.trade.inputAmount.currency.isNative
                ? quoteResult.trade.inputAmount.currency.wrapped.chainId
                : quoteResult.trade.inputAmount.currency.chainId,
              to: quoteResult.methodParameters.to,
              recipient: quoteParams.recipient,
              value: quoteResult.methodParameters.value,
              calldata: quoteResult.methodParameters.calldata,
              quote: quoteResult.quote.toExact(),
              blockNumber: quoteResult.blockNumber.toString(),
              tokenIn: quoteResult.trade.inputAmount.currency.isNative
                ? quoteResult.trade.inputAmount.currency.wrapped.address
                : quoteResult.trade.inputAmount.currency.address,
              tokenInDecimals: quoteResult.trade.inputAmount.currency.isNative
                ? quoteResult.trade.inputAmount.currency.wrapped.decimals
                : quoteResult.trade.inputAmount.currency.decimals,
              amountIn: quoteResult.trade.inputAmount.toExact(),
              tokenOut: quoteResult.trade.outputAmount.currency.isNative
                ? quoteResult.trade.outputAmount.currency.wrapped.address
                : quoteResult.trade.outputAmount.currency.address,
              amountOut: quoteResult.trade.outputAmount.toExact(),
              tokenOutDecimals: quoteResult.trade.outputAmount.currency.isNative
                ? quoteResult.trade.outputAmount.currency.wrapped.decimals
                : quoteResult.trade.outputAmount.currency.decimals,
              timestamp: Date.now(),
            },
          });
        } catch (error) {
          return JSON.stringify({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      },
    );
    const parsedQuoteResponse = JSON.parse(quoteResponse);
    if (parsedQuoteResponse.status === 'error') {
      throw new Error(`Error getting Uniswap quote: ${parsedQuoteResponse.error}`);
    }
    const { quoteResult } = parsedQuoteResponse;

    const deterministicallyStringifiedQuoteResult = deterministicJsonStringify(quoteResult);
    if (!deterministicallyStringifiedQuoteResult) {
      throw new Error('Failed to stringify Uniswap quote');
    }

    const signatureSuccess = await Lit.Actions.ethPersonalSignMessageEcdsa({
      message: deterministicallyStringifiedQuoteResult,
      publicKey: pkpPublicKey,
      sigName: 'prepare-uniswap-route-signature',
    });
    if (!signatureSuccess) {
      throw new Error('Failed to sign Uniswap quote');
    }

    const successResponse: PrepareSuccessResponse = {
      success: true,
      quote: quoteResult,
    };

    Lit.Actions.setResponse({ response: JSON.stringify(successResponse) });
  } catch (error) {
    console.error('Error creating Uniswap quote:', error);

    const errorResponse: PrepareErrorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    Lit.Actions.setResponse({
      response: JSON.stringify(errorResponse),
    });
  }
})();
