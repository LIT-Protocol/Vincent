import { getUniswapQuote } from '../ability-helpers/get-uniswap-quote';
import type { QuoteParams, PrepareSuccessResult } from './types';

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

          return JSON.stringify({
            status: 'success',
            quoteResult: {
              ...quoteResult,
              estimatedGasUsed: quoteResult.estimatedGasUsed.toString(),
              estimatedGasUsedUSD: quoteResult.estimatedGasUsedUSD.toExact(),
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

    if (!quoteResult.methodParameters) {
      throw new Error('No method parameters returned from quote');
    }

    const formattedUniswapQuote = {
      to: quoteResult.methodParameters.to,
      value: quoteResult.methodParameters.value,
      calldata: quoteResult.methodParameters.calldata,
      estimatedGasUsed: quoteResult.estimatedGasUsed,
      estimatedGasUsedUSD: quoteResult.estimatedGasUsedUSD,
    };

    const signature = await Lit.Actions.ethPersonalSignMessageEcdsa({
      message: JSON.stringify(formattedUniswapQuote),
      publicKey: pkpPublicKey,
      sigName: 'prepare-uniswap-route-signature',
    });

    const successResponse: PrepareSuccessResult = {
      success: true,
      result: {
        ...formattedUniswapQuote,
        signature,
      },
    };

    Lit.Actions.setResponse({ response: JSON.stringify(successResponse) });
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
