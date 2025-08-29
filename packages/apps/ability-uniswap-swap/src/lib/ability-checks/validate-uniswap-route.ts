import { ethers } from 'ethers';
import { SWAP_ROUTER_02_ADDRESSES } from '@uniswap/sdk-core';

import SwapRouter02ABI from '../ability-helpers/SwapRouter02ABI.json';

type Route = {
  to: string;
  calldata: string;
  estimatedGasUsed: string;
};

type ValidationResult = { valid: boolean; reason?: string };

const iface = new ethers.utils.Interface(SwapRouter02ABI);

const equalAddress = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const asBigNumber = (v: string | number | ethers.BigNumberish) => ethers.BigNumber.from(v);
const equalAmount = (actual: ethers.BigNumber, expectedRaw: string) =>
  actual.eq(asBigNumber(expectedRaw));

// Decode a Uniswap V3 path hex into first and last token addresses.
function v3PathEndpoints(pathHex: string): { first: string; last: string } {
  const hex = pathHex.startsWith('0x') ? pathHex.slice(2) : pathHex;
  // first token = first 20 bytes (40 hex chars)
  const first = '0x' + hex.slice(0, 40);
  // last token = last 20 bytes (tokens are 20b separated by 3b fees; the last token sits at the tail)
  const last = '0x' + hex.slice(hex.length - 40);
  return { first, last };
}

function validateInputSwap(
  tokenIn: string,
  tokenOut: string,
  tokenInAmountRaw: string,
  expectedRecipient: string,
  decodedArgs: any,
  usePath?: boolean,
): ValidationResult {
  const { first, last } = usePath
    ? v3PathEndpoints(decodedArgs.path)
    : { first: decodedArgs.tokenIn, last: decodedArgs.tokenOut };
  if (!equalAddress(first, tokenIn))
    return {
      valid: false,
      reason: `${usePath ? 'path ' : ''}tokenIn mismatch: expected ${tokenIn}, received ${first}`,
    };
  if (!equalAddress(last, tokenOut))
    return {
      valid: false,
      reason: `${usePath ? 'path ' : ''}tokenOut mismatch: expected ${tokenOut}, received ${last}`,
    };
  if (!equalAddress(decodedArgs.recipient, expectedRecipient)) {
    return {
      valid: false,
      reason: `recipient mismatch: expected ${expectedRecipient}, received ${decodedArgs.recipient}`,
    };
  }
  if (!equalAmount(asBigNumber(decodedArgs.amountIn), tokenInAmountRaw))
    return {
      valid: false,
      reason: `amountIn mismatch: expected ${tokenInAmountRaw}, received ${decodedArgs.amountIn.toString()}`,
    };
  return { valid: true };
}

function validateOutputSwap(
  tokenIn: string,
  tokenOut: string,
  tokenInAmountRaw: string,
  expectedRecipient: string,
  decodedArgs: any,
  usePath?: boolean,
): ValidationResult {
  const { first, last } = usePath
    ? v3PathEndpoints(decodedArgs.path)
    : { first: decodedArgs.tokenIn, last: decodedArgs.tokenOut };
  if (!equalAddress(usePath ? last : first, tokenIn))
    return {
      valid: false,
      reason: `${usePath ? 'path ' : ''}tokenIn mismatch: expected ${tokenIn}, received ${usePath ? last : first}`,
    };
  if (!equalAddress(usePath ? first : last, tokenOut))
    return {
      valid: false,
      reason: `${usePath ? 'path ' : ''}tokenOut mismatch: expected ${tokenOut}, received ${usePath ? first : last}`,
    };
  if (!equalAddress(decodedArgs.recipient, expectedRecipient)) {
    return {
      valid: false,
      reason: `recipient mismatch: expected ${expectedRecipient}, received ${decodedArgs.recipient}`,
    };
  }
  if (asBigNumber(decodedArgs.amountInMaximum).gt(asBigNumber(tokenInAmountRaw)))
    return {
      valid: false,
      reason: `amountInMaximum exceeds expected tokenInAmount: expected <= ${tokenInAmountRaw}, received ${decodedArgs.amountInMaximum.toString()}`,
    };
  return { valid: true };
}

// Validate a decoded router call against expected inputs.
function validateDecoded(
  decoded: ethers.utils.TransactionDescription,
  tokenIn: string,
  tokenInAmountRaw: string,
  tokenOut: string,
  expectedRecipient: string,
): ValidationResult {
  try {
    const decodedArgs = decoded.args[0];
    switch (decoded.name) {
      // V3 swap functions
      case 'exactInputSingle':
        return validateInputSwap(
          tokenIn,
          tokenOut,
          tokenInAmountRaw,
          expectedRecipient,
          decodedArgs,
        );
      case 'exactInput':
        return validateInputSwap(
          tokenIn,
          tokenOut,
          tokenInAmountRaw,
          expectedRecipient,
          decodedArgs,
          true,
        );

      case 'exactOutputSingle':
        return validateOutputSwap(
          tokenIn,
          tokenOut,
          tokenInAmountRaw,
          expectedRecipient,
          decodedArgs,
        );
      case 'exactOutput':
        return validateOutputSwap(
          tokenIn,
          tokenOut,
          tokenInAmountRaw,
          expectedRecipient,
          decodedArgs,
          true,
        );

      // V2 swap functions
      case 'swapExactTokensForTokens': {
        // swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to)
        const [amountIn, amountOutMin, path, to] = decoded.args;
        if (!equalAmount(asBigNumber(amountIn), tokenInAmountRaw))
          return {
            valid: false,
            reason: `amountIn mismatch: expected ${tokenInAmountRaw}, received ${amountIn.toString()}`,
          };
        if (!equalAddress(path[0], tokenIn))
          return {
            valid: false,
            reason: `path[0] mismatch: expected ${tokenIn}, received ${path[0]}`,
          };
        if (!equalAddress(path[path.length - 1], tokenOut))
          return {
            valid: false,
            reason: `path[last] mismatch: expected ${tokenOut}, received ${path[path.length - 1]}`,
          };
        if (!equalAddress(to, expectedRecipient))
          return {
            valid: false,
            reason: `recipient mismatch: expected ${expectedRecipient}, received ${to}`,
          };
        return { valid: true };
      }

      case 'swapTokensForExactTokens': {
        // swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] path, address to)
        const [amountOut, amountInMax, path, to] = decoded.args;
        if (asBigNumber(amountInMax).gt(asBigNumber(tokenInAmountRaw)))
          return {
            valid: false,
            reason: `amountInMax exceeds expected tokenInAmount: expected <= ${tokenInAmountRaw}, received ${amountInMax.toString()}`,
          };
        if (!equalAddress(path[0], tokenIn))
          return {
            valid: false,
            reason: `path[0] mismatch: expected ${tokenIn}, received ${path[0]}`,
          };
        if (!equalAddress(path[path.length - 1], tokenOut))
          return {
            valid: false,
            reason: `path[last] mismatch: expected ${tokenOut}, received ${path[path.length - 1]}`,
          };
        if (!equalAddress(to, expectedRecipient))
          return {
            valid: false,
            reason: `recipient mismatch: expected ${expectedRecipient}, received ${to}`,
          };
        return { valid: true };
      }

      case 'multicall': {
        // Multicall is accepted without deep validation because:
        // - AlphaRouter often generates complex calldata (multi-hop, split routes, internal batching)
        //    that cannot be deterministically reconstructed off-chain.
        // - Intermediate tokens may appear that are not part of the declared input/output pair.
        return { valid: true };
      }

      default:
        // Function exists in SwapRouter02 ABI but we're not allowing it outside of a multicall
        return { valid: false, reason: `Unsupported function: ${decoded.name}` };
    }
  } catch (e) {
    return { valid: false, reason: `Failed to validate decoded call: ${(e as Error).message}` };
  }
}

export const validateUniswapRoute = ({
  route,
  chainId,
  tokenInAddress,
  tokenInAmount,
  tokenOutAddress,
  expectedRecipient,
}: {
  route: Route;
  chainId: number;
  tokenInAddress: string;
  tokenInAmount: string; // base units string
  tokenOutAddress: string;
  expectedRecipient: string;
}): ValidationResult => {
  // 1) Router check
  const expected = SWAP_ROUTER_02_ADDRESSES(chainId);
  if (!expected) return { valid: false, reason: `no SwapRouter02 for chain ${chainId}` };
  if (!equalAddress(route.to, expected))
    return { valid: false, reason: `router mismatch: expected ${expected}, got ${route.to}` };

  // 2) Calldata decode + validation
  try {
    const decoded = iface.parseTransaction({ data: route.calldata });
    return validateDecoded(
      decoded,
      tokenInAddress,
      tokenInAmount,
      tokenOutAddress,
      expectedRecipient,
    );
  } catch (e) {
    console.log('Failed to decode calldata for validation:', e);
    return { valid: false, reason: `Failed to decode calldata: ${(e as Error).message}` };
  }
};
