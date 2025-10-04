export interface QuoteParams {
  rpcUrl: string;
  tokenInAddress: string;
  tokenInAmount: string;
  tokenOutAddress: string;
  recipient: string;
  slippageTolerance?: number;
}

export interface PrepareUniswapRoute {
  chainId: number;
  to: string;
  recipient: string;
  value: string;
  calldata: string;
  quote: string;
  blockNumber: string;
  tokenIn: string;
  tokenInDecimals: number;
  amountIn: string;
  tokenOut: string;
  tokenOutDecimals: number;
  amountOut: string;
  timestamp: number;
}

export interface PrepareSuccessResult {
  quote: PrepareUniswapRoute;
  signature: string;
}

export interface PrepareErrorResponse {
  success: false;
  error: string;
}

export interface PrepareSuccessResponse {
  success: true;
  quote: PrepareUniswapRoute;
}

export interface PrepareErrorResponse {
  success: false;
  error: string;
}

export type PrepareResponse = PrepareSuccessResponse | PrepareErrorResponse;

export type PrepareSignedUniswapQuote = PrepareSuccessResult & {
  dataSigned: string;
  signerPublicKey: string;
  signerEthAddress: string;
};
