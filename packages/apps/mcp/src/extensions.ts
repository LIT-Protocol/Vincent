/**
 * Server extensions for Vincent MCP
 *
 * This module provides functionality to extend an MCP server with additional abilities
 * for Vincent applications. These abilities enable the server to provide information
 * about delegators, PKP balances, tokens, and token allowances.
 *
 * The extensions enhance the base MCP server with blockchain-specific capabilities
 * that are useful for Vincent applications interacting with the Lit Network to act
 * on behalf of their delegators.
 *
 * @module extensions
 * @category Vincent MCP
 */

import { LIT_EVM_CHAINS } from '@lit-protocol/constants';
import { buildMcpAbilityName, VincentAppDef } from '@lit-protocol/vincent-mcp-sdk';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ethers } from 'ethers';
import { z } from 'zod';

const ERC20_ABI = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
] as const;

/**
 * Gets information about a Lit-supported blockchain by its chain ID
 *
 * This function looks up a blockchain in the list of Lit-supported chains
 * and returns its configuration data.
 *
 * @param chainId - The chain ID as a string
 * @returns The chain configuration data
 * @throws Error if Lit does not support the chain
 * @internal
 */
function getLitSupportedChainData(chainId: number) {
  const litSupportedChain = Object.values(LIT_EVM_CHAINS).find(
    (chain) => chain.chainId === chainId,
  );
  if (!litSupportedChain) {
    throw new Error(`Chain ${chainId} is not supported.`);
  }

  return litSupportedChain;
}

/**
 * Extends an MCP server with additional abilities for Vincent applications
 *
 * This function adds several abilities to an MCP server that provide blockchain-specific
 * capabilities useful for Vincent applications:
 *
 * 1. `get-delegators-info`: Gets information about the delegators for the Vincent app
 * 2. `native-balance`: Gets the native token balance for a PKP address on a specific chain
 * 3. `token-info`: Gets information about an ERC20 token on a specific chain
 * 4. `token-allowance`: Gets information about token allowances for a PKP address
 *
 * These abilities enhance the base MCP server with capabilities that allow LLMs to
 * query and interact with blockchain data.
 *
 * @param server - The MCP server to extend
 * @param vincentAppDefinition - The Vincent application definition
 * @param delegateeSigner - The Ethereum signer used to execute the abilities
 *
 * @example
 * ```typescript
 * import { VincentAppDef } from '@lit-protocol/vincent-mcp-sdk';
 * import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
 * import { ethers } from 'ethers';
 * import { extendVincentServer } from '@lit-protocol/vincent-mcp-server';
 *
 * // Create a base MCP server
 * const server = new McpServer({
 *   name: 'My Vincent App',
 *   version: '1',
 * });
 *
 * // Define your Vincent application
 * const appDef: VincentAppDef = {
 *   id: '8462368',
 *   name: 'My Vincent App',
 *   version: '1',
 *   abilities: {
 *     // Your abilities here
 *   }
 * };
 *
 * // Create a signer
 * const delegateeSigner = new ethers.Wallet('YOUR_PRIVATE_KEY');
 *
 * // Extend the server with additional abilities
 * extendVincentServer(server, appDef, delegateeSigner);
 * // Now the server has additional abilities to query blockchain data
 * ```
 */
export function extendVincentServer(
  server: McpServer,
  vincentAppDefinition: VincentAppDef,
  delegateeSigner: ethers.Signer,
) {
  // Add more resources, abilities, and prompts as needed
  server.tool(
    buildMcpAbilityName(vincentAppDefinition, 'native-balance'),
    'Resource to get the native balance for a given PKP ETH address on a given chain.',
    {
      chainId: z.coerce
        .number()
        .describe('The chain ID to execute the query the balance on. For example: 8453 for Base.'),
      pkpEthAddress: z
        .string()
        .describe(
          'The PKP address to query the balance for. For example 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045.',
        ),
    },
    async ({ chainId, pkpEthAddress }) => {
      const chain = getLitSupportedChainData(chainId);
      const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrls[0]);
      const balance = await provider.getBalance(pkpEthAddress);

      return {
        content: [
          {
            type: 'text',
            text: ethers.utils.formatEther(balance),
          },
        ],
      };
    },
  );

  server.tool(
    buildMcpAbilityName(vincentAppDefinition, 'erc20-balance'),
    'Resource to get the ERC20 balance for a given PKP ETH address on a given chain.',
    {
      chainId: z.coerce
        .number()
        .describe('The chain ID to execute the query the balance on. For example: 8453 for Base.'),
      pkpEthAddress: z
        .string()
        .describe(
          "The delegator's PKP address. For example 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045.",
        ),
      tokenAddress: z
        .string()
        .describe(
          'The ERC20 token address to query the balance for. For example 0x4200000000000000000000000000000000000006 for WETH on Base.',
        ),
    },
    async ({ chainId, pkpEthAddress, tokenAddress }) => {
      const chain = getLitSupportedChainData(chainId);
      const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrls[0]);
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const [balance, decimals] = await Promise.all([
        tokenContract.balanceOf(pkpEthAddress),
        tokenContract.decimals(),
      ]);

      return {
        content: [
          {
            type: 'text',
            text: ethers.utils.formatUnits(balance, decimals),
          },
        ],
      };
    },
  );

  server.tool(
    buildMcpAbilityName(vincentAppDefinition, 'erc20-allowance'),
    'Resource to get the ERC20 allowance for a given PKP ETH address on a given chain.',
    {
      chainId: z.coerce
        .number()
        .describe(
          'The chain ID to execute the query the allowance on. For example: 8453 for Base.',
        ),
      pkpEthAddress: z
        .string()
        .describe(
          "The delegator's PKP address. For example 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045.",
        ),
      tokenAddress: z
        .string()
        .describe(
          'The ERC20 token address to query the allowance for. For example 0x4200000000000000000000000000000000000006 for WETH on Base.',
        ),
      spenderAddress: z
        .string()
        .describe(
          'The spender address to query the allowance for. For example 0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed for Uniswap V3 Router on Base.',
        ),
    },
    async ({ chainId, pkpEthAddress, spenderAddress, tokenAddress }) => {
      const chain = getLitSupportedChainData(chainId);
      const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrls[0]);
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const [allowance, decimals] = await Promise.all([
        tokenContract.allowance(pkpEthAddress, spenderAddress),
        tokenContract.decimals(),
      ]);

      return {
        content: [
          {
            type: 'text',
            text: ethers.utils.formatUnits(allowance, decimals),
          },
        ],
      };
    },
  );
}
