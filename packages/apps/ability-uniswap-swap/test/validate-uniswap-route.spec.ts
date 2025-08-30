import { ethers } from 'ethers';
import SwapRouter02ABI from '@uniswap/swap-router-contracts/artifacts/contracts/SwapRouter02.sol/SwapRouter02.json';

import { validateUniswapRoute } from '../src/lib/ability-checks/validate-uniswap-route';

describe('validateUniswapRoute', () => {
  const ROUTER_ADDRESS = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45';
  const TOKEN_IN = '0x6B175474E89094C44Da98b954EedeAC495271d0F'; // DAI
  const TOKEN_OUT = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // USDC
  const AMOUNT_IN = '1000000000000000000'; // 1 DAI
  const RECIPIENT = '0x1234567890123456789012345678901234567890';
  const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  const DEFAULT_DEADLINE = Math.floor(Date.now() / 1000) + 3600;

  // Use the SwapRouter02 ABI which includes both V2 and V3 functions including multicall
  const iface = new ethers.utils.Interface(SwapRouter02ABI.abi);

  // Helper functions to create common parameter objects
  const createV3SingleParams = (overrides = {}) => ({
    tokenIn: TOKEN_IN,
    tokenOut: TOKEN_OUT,
    fee: 3000,
    recipient: RECIPIENT,
    deadline: DEFAULT_DEADLINE,
    amountIn: AMOUNT_IN,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
    ...overrides,
  });

  const createV3MultiParams = (path: string, overrides = {}) => ({
    path,
    recipient: RECIPIENT,
    deadline: DEFAULT_DEADLINE,
    amountIn: AMOUNT_IN,
    amountOutMinimum: 0,
    ...overrides,
  });

  const createV3OutputSingleParams = (overrides = {}) => ({
    tokenIn: TOKEN_IN,
    tokenOut: TOKEN_OUT,
    fee: 3000,
    recipient: RECIPIENT,
    deadline: DEFAULT_DEADLINE,
    amountOut: '1000000', // 1 USDC
    amountInMaximum: AMOUNT_IN,
    sqrtPriceLimitX96: 0,
    ...overrides,
  });

  const createV3OutputMultiParams = (path: string, overrides = {}) => ({
    path,
    recipient: RECIPIENT,
    deadline: DEFAULT_DEADLINE,
    amountOut: '1000000', // 1 USDC
    amountInMaximum: AMOUNT_IN,
    ...overrides,
  });

  const createV3Path = (tokenA: string, tokenB: string, fee = 3000) =>
    ethers.utils.hexlify(
      ethers.utils.concat([tokenA, ethers.utils.hexZeroPad(ethers.utils.hexlify(fee), 3), tokenB]),
    );

  const createRouteParams = (calldata: string, overrides: any = {}) => ({
    route: {
      to: ROUTER_ADDRESS,
      calldata,
      estimatedGasUsed: '100000',
      ...(overrides.route || {}),
    },
    chainId: 1,
    tokenInAddress: TOKEN_IN,
    tokenInAmount: AMOUNT_IN,
    tokenOutAddress: TOKEN_OUT,
    expectedRecipient: RECIPIENT,
    ...overrides,
  });

  describe('Router validation', () => {
    it('should fail if no router address for chain', () => {
      const result = validateUniswapRoute(createRouteParams('0x', { chainId: 999 })); // unsupported chain

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('no SwapRouter02 for chain 999');
    });

    it('should fail if router address mismatch', () => {
      const result = validateUniswapRoute(
        createRouteParams('0x', { route: { to: '0x0000000000000000000000000000000000000000' } }),
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('router mismatch');
    });
  });

  describe('exactInputSingle validation', () => {
    it('should validate correct exactInputSingle call', () => {
      const params = createV3SingleParams();
      const calldata = iface.encodeFunctionData('exactInputSingle', [params]);
      const result = validateUniswapRoute(createRouteParams(calldata));

      expect(result.valid).toBe(true);
    });

    it('should fail if tokenIn mismatch', () => {
      const params = createV3SingleParams({
        tokenIn: '0x0000000000000000000000000000000000000001',
      });
      const calldata = iface.encodeFunctionData('exactInputSingle', [params]);
      const result = validateUniswapRoute(createRouteParams(calldata));

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('tokenIn mismatch');
    });

    it('should fail if tokenOut mismatch', () => {
      const params = createV3SingleParams({
        tokenOut: '0x0000000000000000000000000000000000000001',
      });
      const calldata = iface.encodeFunctionData('exactInputSingle', [params]);
      const result = validateUniswapRoute(createRouteParams(calldata));

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('tokenOut mismatch');
    });

    it('should fail if amountIn mismatch', () => {
      const params = createV3SingleParams({ amountIn: '2000000000000000000' }); // 2 DAI instead of 1
      const calldata = iface.encodeFunctionData('exactInputSingle', [params]);
      const result = validateUniswapRoute(createRouteParams(calldata));

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('amountIn mismatch');
    });

    it('should fail if recipient mismatch', () => {
      const params = createV3SingleParams({
        recipient: '0x9999999999999999999999999999999999999999',
      }); // wrong recipient
      const calldata = iface.encodeFunctionData('exactInputSingle', [params]);
      const result = validateUniswapRoute(createRouteParams(calldata));

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('recipient mismatch');
    });
  });

  describe('exactInput (multi-hop) validation', () => {
    it('should validate correct exactInput call', () => {
      const path = createV3Path(TOKEN_IN, TOKEN_OUT);
      const params = createV3MultiParams(path);
      const calldata = iface.encodeFunctionData('exactInput', [params]);
      const result = validateUniswapRoute(createRouteParams(calldata));

      expect(result.valid).toBe(true);
    });

    it('should validate multi-hop path correctly', () => {
      // Create a multi-hop path: TOKEN_IN -> 3000 -> WETH -> 500 -> TOKEN_OUT
      const path = ethers.utils.hexlify(
        ethers.utils.concat([
          TOKEN_IN,
          ethers.utils.hexZeroPad(ethers.utils.hexlify(3000), 3),
          WETH,
          ethers.utils.hexZeroPad(ethers.utils.hexlify(500), 3),
          TOKEN_OUT,
        ]),
      );
      const params = createV3MultiParams(path);
      const calldata = iface.encodeFunctionData('exactInput', [params]);
      const result = validateUniswapRoute(createRouteParams(calldata));

      expect(result.valid).toBe(true);
    });
  });

  describe('exactOutputSingle validation', () => {
    it('should validate correct exactOutputSingle call', () => {
      const params = createV3OutputSingleParams();
      const calldata = iface.encodeFunctionData('exactOutputSingle', [params]);
      const result = validateUniswapRoute(createRouteParams(calldata));

      expect(result.valid).toBe(true);
    });

    it('should fail if amountInMaximum exceeds expected tokenInAmount', () => {
      const params = createV3OutputSingleParams({ amountInMaximum: '2000000000000000000' }); // 2 DAI max, user only willing to spend 1 DAI
      const calldata = iface.encodeFunctionData('exactOutputSingle', [params]);
      const result = validateUniswapRoute(createRouteParams(calldata));

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('amountInMaximum exceeds expected tokenInAmount');
    });
  });

  describe('exactOutput (multi-hop) validation', () => {
    it('should validate correct exactOutput call', () => {
      // For exactOutput, path is reversed: TOKEN_OUT -> fee -> TOKEN_IN
      const path = createV3Path(TOKEN_OUT, TOKEN_IN);
      const params = createV3OutputMultiParams(path);
      const calldata = iface.encodeFunctionData('exactOutput', [params]);
      const result = validateUniswapRoute(createRouteParams(calldata));

      expect(result.valid).toBe(true);
    });
  });

  describe('V2 swap methods', () => {
    describe('swapExactTokensForTokens validation', () => {
      it('should validate correct swapExactTokensForTokens call', () => {
        const path = [TOKEN_IN, TOKEN_OUT];
        const calldata = iface.encodeFunctionData('swapExactTokensForTokens', [
          AMOUNT_IN,
          0, // amountOutMin
          path,
          RECIPIENT,
        ]);

        const result = validateUniswapRoute(createRouteParams(calldata));

        expect(result.valid).toBe(true);
      });

      it('should validate multi-hop V2 path', () => {
        const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
        const path = [TOKEN_IN, WETH, TOKEN_OUT];
        const calldata = iface.encodeFunctionData('swapExactTokensForTokens', [
          AMOUNT_IN,
          0, // amountOutMin
          path,
          RECIPIENT,
        ]);

        const result = validateUniswapRoute(createRouteParams(calldata));

        expect(result.valid).toBe(true);
      });

      it('should fail if amountIn mismatch', () => {
        const path = [TOKEN_IN, TOKEN_OUT];
        const calldata = iface.encodeFunctionData('swapExactTokensForTokens', [
          '2000000000000000000', // 2 DAI instead of 1
          0,
          path,
          RECIPIENT,
        ]);

        const result = validateUniswapRoute(createRouteParams(calldata));

        expect(result.valid).toBe(false);
        expect(result.reason).toContain('amountIn mismatch');
      });

      it('should fail if path[0] mismatch', () => {
        const wrongTokenIn = '0x0000000000000000000000000000000000000001';
        const path = [wrongTokenIn, TOKEN_OUT];
        const calldata = iface.encodeFunctionData('swapExactTokensForTokens', [
          AMOUNT_IN,
          0,
          path,
          RECIPIENT,
        ]);

        const result = validateUniswapRoute(createRouteParams(calldata));

        expect(result.valid).toBe(false);
        expect(result.reason).toContain('path[0] mismatch');
      });

      it('should fail if path[last] mismatch', () => {
        const wrongTokenOut = '0x0000000000000000000000000000000000000002';
        const path = [TOKEN_IN, wrongTokenOut];
        const calldata = iface.encodeFunctionData('swapExactTokensForTokens', [
          AMOUNT_IN,
          0,
          path,
          RECIPIENT,
        ]);

        const result = validateUniswapRoute(createRouteParams(calldata));

        expect(result.valid).toBe(false);
        expect(result.reason).toContain('path[last] mismatch');
      });

      it('should fail if recipient mismatch', () => {
        const wrongRecipient = '0x9999999999999999999999999999999999999999';
        const path = [TOKEN_IN, TOKEN_OUT];
        const calldata = iface.encodeFunctionData('swapExactTokensForTokens', [
          AMOUNT_IN,
          0,
          path,
          wrongRecipient,
        ]);

        const result = validateUniswapRoute(createRouteParams(calldata));

        expect(result.valid).toBe(false);
        expect(result.reason).toContain('recipient mismatch');
      });
    });

    describe('swapTokensForExactTokens validation', () => {
      it('should validate correct swapTokensForExactTokens call', () => {
        const path = [TOKEN_IN, TOKEN_OUT];
        const calldata = iface.encodeFunctionData('swapTokensForExactTokens', [
          '1000000', // amountOut (1 USDC)
          AMOUNT_IN, // amountInMax (1 DAI)
          path,
          RECIPIENT,
        ]);

        const result = validateUniswapRoute(createRouteParams(calldata));

        expect(result.valid).toBe(true);
      });

      it('should fail if amountInMax exceeds expected tokenInAmount', () => {
        const path = [TOKEN_IN, TOKEN_OUT];
        const calldata = iface.encodeFunctionData('swapTokensForExactTokens', [
          '1000000', // amountOut
          '2000000000000000000', // amountInMax (2 DAI, exceeds 1 DAI limit)
          path,
          RECIPIENT,
        ]);

        const result = validateUniswapRoute(createRouteParams(calldata));

        expect(result.valid).toBe(false);
        expect(result.reason).toContain('amountInMax exceeds expected tokenInAmount');
      });

      it('should fail if path[0] mismatch', () => {
        const wrongTokenIn = '0x0000000000000000000000000000000000000001';
        const path = [wrongTokenIn, TOKEN_OUT];
        const calldata = iface.encodeFunctionData('swapTokensForExactTokens', [
          '1000000',
          AMOUNT_IN,
          path,
          RECIPIENT,
        ]);

        const result = validateUniswapRoute(createRouteParams(calldata));

        expect(result.valid).toBe(false);
        expect(result.reason).toContain('path[0] mismatch');
      });

      it('should fail if path[last] mismatch', () => {
        const wrongTokenOut = '0x0000000000000000000000000000000000000002';
        const path = [TOKEN_IN, wrongTokenOut];
        const calldata = iface.encodeFunctionData('swapTokensForExactTokens', [
          '1000000',
          AMOUNT_IN,
          path,
          RECIPIENT,
        ]);

        const result = validateUniswapRoute(createRouteParams(calldata));

        expect(result.valid).toBe(false);
        expect(result.reason).toContain('path[last] mismatch');
      });

      it('should fail if recipient mismatch', () => {
        const wrongRecipient = '0x9999999999999999999999999999999999999999';
        const path = [TOKEN_IN, TOKEN_OUT];
        const calldata = iface.encodeFunctionData('swapTokensForExactTokens', [
          '1000000',
          AMOUNT_IN,
          path,
          wrongRecipient,
        ]);

        const result = validateUniswapRoute(createRouteParams(calldata));

        expect(result.valid).toBe(false);
        expect(result.reason).toContain('recipient mismatch');
      });

      it('should validate multi-hop V2 path', () => {
        const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
        const path = [TOKEN_IN, WETH, TOKEN_OUT];
        const calldata = iface.encodeFunctionData('swapTokensForExactTokens', [
          '1000000',
          AMOUNT_IN,
          path,
          RECIPIENT,
        ]);

        const result = validateUniswapRoute(createRouteParams(calldata));

        expect(result.valid).toBe(true);
      });
    });
  });

  describe('multicall validation', () => {
    it('should validate multicall with valid inner swap', () => {
      const innerParams = createV3SingleParams();
      const innerCalldata = iface.encodeFunctionData('exactInputSingle', [innerParams]);
      const calldata = iface.encodeFunctionData('multicall(bytes[])', [[innerCalldata]]);
      const result = validateUniswapRoute(createRouteParams(calldata));

      expect(result.valid).toBe(true);
    });
  });

  describe('unsupported functions', () => {
    it('should fail for sweepToken function (unsupported outside multicall)', () => {
      const calldata = iface.encodeFunctionData('sweepToken(address,uint256,address)', [
        TOKEN_IN, // token
        '1000000000000000000', // amountMinimum
        RECIPIENT, // recipient
      ]);
      const result = validateUniswapRoute(createRouteParams(calldata));

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Unsupported function: sweepToken');
    });
  });

  describe('parse/decode failures', () => {
    it('should fail with empty calldata', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const result = validateUniswapRoute(createRouteParams('0x'));

      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/^Failed to decode calldata:/);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to decode calldata'),
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it('should fail with random bytes', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const result = validateUniswapRoute(createRouteParams('0x1234567890abcdef1234567890abcdef'));

      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/^Failed to decode calldata:/);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to decode calldata'),
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });
});
