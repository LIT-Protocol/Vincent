import { ethers } from 'ethers';
import { SWAP_ROUTER_02_ADDRESSES } from '@uniswap/sdk-core';

// Build allowed function selectors from human-readable signatures
function buildAllowedSelectors() {
  const signatures = [
    // SwapRouter02 core swap functions
    'exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))',
    'exactInput((bytes,address,uint256,uint256))',
    'exactOutputSingle((address,address,uint24,address,uint256,uint256,uint160))',
    'exactOutput((bytes,address,uint256,uint256))',

    // Multicall functions for batching
    'multicall(uint256,bytes[])',
    'multicall(bytes[])',

    // V2 Router functions (for compatibility)
    'swapExactTokensForTokens(uint256,uint256,address[],address,uint256)',
    'swapTokensForExactTokens(uint256,uint256,address[],address,uint256)',
  ];

  const selectors = new Set<string>();
  signatures.forEach((sig) => {
    const selector = ethers.utils.id(sig).slice(0, 10).toLowerCase();
    selectors.add(selector);
  });

  return selectors;
}

// Generate allowed selectors from human-readable signatures
const UNISWAP_FUNCTION_SELECTORS = buildAllowedSelectors();

export const validateUniswapRoute = ({
  route,
  chainId,
}: {
  route: {
    to: string;
    calldata: string;
    estimatedGasUsed: string;
  };
  chainId: number;
}): { valid: boolean; reason?: string } => {
  // 1. Validate router address is a known Uniswap router
  const swapRouter02 = SWAP_ROUTER_02_ADDRESSES(chainId);
  if (!swapRouter02) {
    return { valid: false, reason: `No SwapRouter02 address found for chain ${chainId}` };
  }

  if (route.to.toLowerCase() !== swapRouter02.toLowerCase()) {
    return {
      valid: false,
      reason: `Router address ${route.to} is not the expected Uniswap SwapRouter02 for chain ${chainId}. Expected: ${swapRouter02}`,
    };
  }

  // 2. Validate calldata has a permitted Uniswap function selector
  const functionSelector = route.calldata.slice(0, 10).toLowerCase();
  if (!UNISWAP_FUNCTION_SELECTORS.has(functionSelector)) {
    return {
      valid: false,
      reason: `Function selector ${functionSelector} is not a known or supported Uniswap function. Supported functions: ${Array.from(UNISWAP_FUNCTION_SELECTORS).join(', ')}`,
    };
  }

  return { valid: true };
};
