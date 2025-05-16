import { LIT_EVM_CHAINS } from '@lit-protocol/constants';
import { mcp } from '@lit-protocol/vincent-sdk';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ethers } from 'ethers';
import { z } from 'zod';

import { fetchDelegatedAgentPKPTokenIds } from './contracts';
import { env } from './env';

const { PUBKEY_ROUTER_DATIL_CONTRACT, VINCENT_DATIL_CONTRACT } = env;

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

const PUBKEY_ROUTER_ABI = [
  'function getEthAddress(uint256 tokenId) public view returns (address)',
  'function getPubkey(uint256 tokenId) public view returns (bytes memory)',
] as const;

const NETWORK_CONFIG = {
  datil: {
    pubkeyRouterAddress: PUBKEY_ROUTER_DATIL_CONTRACT,
    vincentAddress: VINCENT_DATIL_CONTRACT,
  },
} as const;

function getLitSupportedChainData(chainId: string) {
  const chainIdNum = parseInt(chainId);
  const litSupportedChain = Object.values(LIT_EVM_CHAINS).find(
    (chain) => chain.chainId === chainIdNum,
  );
  if (!litSupportedChain) {
    throw new Error(`Chain ${chainId} is not supported.`);
  }

  return litSupportedChain;
}

const getPkpInfo = async (
  pkpTokenId: ethers.BigNumber,
): Promise<{
  tokenId: string;
  ethAddress: string;
  publicKey: string;
}> => {
  const yellowstoneChain = LIT_EVM_CHAINS.yellowstone;
  const provider = new ethers.providers.JsonRpcProvider(yellowstoneChain.rpcUrls[0]);

  const pubkeyRouter = new ethers.Contract(
    NETWORK_CONFIG.datil.pubkeyRouterAddress,
    PUBKEY_ROUTER_ABI,
    provider,
  );

  const [ethAddress, publicKey] = await Promise.all([
    pubkeyRouter.getEthAddress(pkpTokenId),
    pubkeyRouter.getPubkey(pkpTokenId),
  ]);

  return {
    tokenId: pkpTokenId.toHexString(),
    ethAddress,
    publicKey,
  };
};

export function extendVincentServer(
  server: McpServer,
  vincentAppDefinition: mcp.VincentAppDef,
  delegateeSigner: ethers.Signer,
) {
  // Add more resources, tools, and prompts as needed
  server.tool(
    'get-delegators-info',
    `Tool to get the delegators info for the ${vincentAppDefinition.name} Vincent App. Info includes the PKP token ID, ETH address, and public key for each delegator.`,
    async () => {
      const appId = parseInt(vincentAppDefinition.id);
      const appVersion = parseInt(vincentAppDefinition.version);

      const delegators = await fetchDelegatedAgentPKPTokenIds(appId, appVersion);
      const delegatorsPkpInfo = await Promise.all(delegators.map(getPkpInfo));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(delegatorsPkpInfo),
          },
        ],
      };
    },
  );

  server.tool(
    'native-balance',
    'Resource to get the native balance for a given PKP ETH address on a given chain.',
    {
      chainId: z
        .string()
        .describe('The chain ID to execute the query the balance on. For example: 8453 for Base.'),
      pkpEthAddress: z
        .string()
        .describe(
          "The delegator's PKP address that will execute the swap. For example 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045.",
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
    'erc20-balance',
    'Resource to get the ERC20 balance for a given PKP ETH address on a given chain.',
    {
      chainId: z
        .string()
        .describe('The chain ID to execute the query the balance on. For example: 8453 for Base.'),
      pkpEthAddress: z
        .string()
        .describe(
          "The delegator's PKP address that will execute the swap. For example 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045.",
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
    'erc20-allowance',
    'Resource to get the ERC20 allowance for a given PKP ETH address on a given chain.',
    {
      chainId: z
        .string()
        .describe(
          'The chain ID to execute the query the allowance on. For example: 8453 for Base.',
        ),
      pkpEthAddress: z
        .string()
        .describe(
          "The delegator's PKP address that will execute the swap. For example 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045.",
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
