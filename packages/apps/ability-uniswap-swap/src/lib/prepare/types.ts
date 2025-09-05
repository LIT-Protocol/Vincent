export interface QuoteParams {
  rpcUrl: string;
  tokenInAddress: string;
  tokenInAmount: string;
  tokenOutAddress: string;
  recipient: string;
  slippageTolerance?: number;
}

export interface PrepareUniswapRoute {
  to: string;
  value: string;
  calldata: string;
  estimatedGasUsed: string;
  estimatedGasUsedUSD: string;
  signature: string;
}

export interface PrepareSuccessResult {
  success: true;
  result: PrepareUniswapRoute;
}

export interface PrepareErrorResult {
  success: false;
  error: string;
}

export type PrepareResult = PrepareSuccessResult | PrepareErrorResult;
