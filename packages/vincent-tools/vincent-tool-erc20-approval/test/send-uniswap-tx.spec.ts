import { Token, Percent } from '@uniswap/sdk-core';
import { Route } from '@uniswap/v3-sdk';
import { sendUniswapTx } from '../src/lib/tool-helpers/send-uniswap-tx';
import { getUniswapQuote } from '../src/lib/tool-helpers/get-uniswap-quote';
import { getEnv } from './test-config';

// Mock Lit.Actions
const mockRunOnce = jest.fn();
const mockSignAndCombineEcdsa = jest.fn();
global.Lit = {
  Actions: {
    runOnce: mockRunOnce,
    signAndCombineEcdsa: mockSignAndCombineEcdsa,
  },
} as any;

describe('sendUniswapTx', () => {
  const rpcUrl = getEnv('RPC_URL_FOR_UNISWAP');
  const chainId = 1; // Ethereum mainnet

  // WETH/USDC pool
  const tokenInAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as `0x${string}`;
  const tokenInDecimals = 18;
  const tokenOutAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`;
  const tokenOutDecimals = 6;
  const tokenInAmount = 0.1; // 0.1 WETH
  const pkpEthAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as `0x${string}`;
  const pkpPublicKey = '0x1234';
  const slippageTolerance = new Percent(50, 10000); // 0.5%
  const swapDeadline = BigInt(Math.floor(Date.now() / 1000) + 1800); // 30 minutes from now

  let uniswapSwapRoute: Route<Token, Token>;
  let uniswapTokenIn: Token;
  let uniswapTokenOut: Token;
  let swapQuote: bigint;

  beforeAll(async () => {
    // Get real Uniswap quote and pool data
    const quoteResult = await getUniswapQuote({
      rpcUrl,
      chainId,
      tokenInAddress,
      tokenInDecimals,
      tokenInAmount,
      tokenOutAddress,
      tokenOutDecimals,
    });

    uniswapSwapRoute = quoteResult.uniswapSwapRoute;
    uniswapTokenIn = quoteResult.uniswapTokenIn;
    uniswapTokenOut = quoteResult.uniswapTokenOut;
    swapQuote = quoteResult.swapQuote;
  });

  beforeEach(() => {
    mockRunOnce.mockClear();
    mockSignAndCombineEcdsa.mockClear();
    // Mock successful signature
    mockSignAndCombineEcdsa.mockResolvedValueOnce(
      JSON.stringify({
        signature: '0x123456789',
        publicKey: pkpPublicKey,
      }),
    );
  });

  it('should send Uniswap swap transaction', async () => {
    // Mock successful transaction
    mockRunOnce.mockResolvedValueOnce(
      JSON.stringify({
        status: 'success',
        txHash: '0x123456789',
      }),
    );

    // Execute
    const result = await sendUniswapTx({
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
    });

    // Verify Lit.Actions.runOnce was called correctly
    expect(mockRunOnce).toHaveBeenCalledTimes(1);
    expect(mockRunOnce).toHaveBeenCalledWith(
      { waitForResponse: true, name: 'uniswapSwapTxSender' },
      expect.any(Function),
    );

    // Verify Lit.Actions.signAndCombineEcdsa was called
    expect(mockSignAndCombineEcdsa).toHaveBeenCalledTimes(1);
    expect(mockSignAndCombineEcdsa).toHaveBeenCalledWith(
      expect.objectContaining({
        publicKey: pkpPublicKey.replace(/^0x/, ''),
        sigName: 'uniswapSwapSig',
      }),
    );

    // Verify result
    expect(result).toBe('0x123456789');
  });

  it('should throw error when transaction fails', async () => {
    // Mock failed transaction
    mockRunOnce.mockResolvedValueOnce(
      JSON.stringify({
        status: 'error',
        error: 'Transaction failed',
      }),
    );

    // Execute and verify error
    await expect(
      sendUniswapTx({
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
      }),
    ).rejects.toThrow('Error sending spend transaction: Transaction failed');
  });

  it('should throw error for unsupported chainId', async () => {
    // Execute with unsupported chainId
    await expect(
      sendUniswapTx({
        rpcUrl,
        chainId: 999, // Unsupported chainId
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
      }),
    ).rejects.toThrow('Unsupported chainId: 999');
  });
});
