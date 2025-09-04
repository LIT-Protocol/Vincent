import { getUniswapQuote } from '../ability-helpers/get-uniswap-quote';
import type { QuoteParams, PrepareSuccessResult } from './types';

declare const Lit: {
  Actions: {
    setResponse: (response: { response: string }) => void;
    getRpcUrl: (args: { chain: string }) => Promise<string>;
  };
};

declare const quoteParams: QuoteParams;

(async () => {
  try {
    console.log('Quote parameters:', quoteParams);

    const quoteResult = await getUniswapQuote(quoteParams);

    if (!quoteResult.methodParameters) {
      throw new Error('No method parameters returned from quote');
    }

    const result: PrepareSuccessResult = {
      success: true,
      result: {
        to: quoteResult.methodParameters.to,
        value: quoteResult.methodParameters.value,
        calldata: quoteResult.methodParameters.calldata,
        estimatedGasUsed: quoteResult.estimatedGasUsed.toString(),
        estimatedGasUsedUSD: quoteResult.estimatedGasUsedUSD.toExact(),
        timestamp: Date.now(),
        signature: '0x',
      },
    };

    // Return the result to the caller
    Lit.Actions.setResponse({ response: JSON.stringify(result) });
  } catch (error) {
    console.error('Error creating Uniswap quote:', error);
    Lit.Actions.setResponse({
      response: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    });
  }
})();
