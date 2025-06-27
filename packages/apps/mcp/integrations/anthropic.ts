import { LIT_EVM_CHAINS } from '@lit-protocol/constants';
import Anthropic from '@anthropic-ai/sdk';
import { ethers } from 'ethers';

const { DELEGATOR_JWT, VINCENT_DELEGATEE_PRIVATE_KEY, VINCENT_MCP_BASE_URL } = process.env;

const YELLOWSTONE = LIT_EVM_CHAINS.yellowstone;

async function delegateeUsage() {
  console.log('====== SHOWING DELEGATEE USAGE ======');

  const anthropic = new Anthropic();

  // Delegatee must identify with a SIWE
  const delegateeSigner = new ethers.Wallet(
    VINCENT_DELEGATEE_PRIVATE_KEY,
    new ethers.providers.StaticJsonRpcProvider(YELLOWSTONE.rpcUrls[0]),
  );
  const delegateeAddress = delegateeSigner.address;

  const getSiweResponse = await fetch(`${VINCENT_MCP_BASE_URL}/siwe?address=${delegateeAddress}`);
  if (!getSiweResponse.ok) {
    throw new Error(`Get SIWE response status: ${getSiweResponse.status}`);
  }

  const { msgToSign } = await getSiweResponse.json();
  const signature = await delegateeSigner.signMessage(msgToSign);
  const base64Message = Buffer.from(msgToSign).toString('base64');

  const msg = await anthropic.beta.messages.create({
    betas: ['mcp-client-2025-04-04'],
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    mcp_servers: [
      {
        type: 'url',
        // Anthropic AI SDK mcp_servers only supports "authorization: Bearer" tokens, so query params must be used to pass SIWE signature and base 64 encoded message
        url: `${VINCENT_MCP_BASE_URL}/mcp?b64message=${base64Message}&signature=${signature}`, // The URL of the MCP server
        name: 'vincent-app',
        tool_configuration: {
          enabled: true,
        },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Check who my delegators are and then check the native balance in base blockchain of the first one.',
          },
        ],
      },
    ],
  });

  console.log(msg.content);
  // Output:
  // [
  //   {
  //     type: 'text',
  //     text: "I'll help you check your delegators and then get the native balance for the first one on Base blockchain."
  //   },
  //   {
  //     type: 'mcp_tool_use',
  //     id: 'mcptoolu_01QEn19nFMqAi9xKBAKgGFGv',
  //     name: 'uniswap-swap-V4-get-delegators-info',
  //     input: {},
  //     server_name: 'vincent-app'
  //   },
  //   {
  //     type: 'mcp_tool_result',
  //     tool_use_id: 'mcptoolu_01QEn19nFMqAi9xKBAKgGFGv',
  //     is_error: false,
  //     content: [ [Object] ]
  //   },
  //   {
  //     type: 'text',
  //     text: "Now I'll check the native balance on Base blockchain (chain ID 8453) for the first delegator with address `0x2b0e8EBA44FE6Fdc87dE6ADfa3367417D97Fd22f`:"
  //   },
  //   {
  //     type: 'mcp_tool_use',
  //     id: 'mcptoolu_01CZ83YZH5m9qNNUdRNmHKxj',
  //     name: 'uniswap-swap-V4-native-balance',
  //     input: {
  //       chainId: 8453,
  //       pkpEthAddress: '0x2b0e8EBA44FE6Fdc87dE6ADfa3367417D97Fd22f'
  //     },
  //     server_name: 'vincent-app'
  //   },
  //   {
  //     type: 'mcp_tool_result',
  //     tool_use_id: 'mcptoolu_01CZ83YZH5m9qNNUdRNmHKxj',
  //     is_error: false,
  //     content: [ [Object] ]
  //   },
  //   {
  //     type: 'text',
  //     text: 'Here are your results:\n' +
  //       '\n' +
  //       '**Your Delegators:**\n' +
  //       '- You have 1 delegator\n' +
  //       '- PKP Token ID: `0x25cde13de35b4ae0bdde4f1a3c910eae236201e8776a182ca0092fcf9495004e`\n' +
  //       '- ETH Address: `0x2b0e8EBA44FE6Fdc87dE6ADfa3367417D97Fd22f`\n' +
  //       '- Public Key: `0x0490f9499c818c3ca1bc7b04fcaa8ceea9f1e3861e7bdddcbbd968a7eb2b74450f98434c0f71a18b2b28fdd2b79b9452bb9cd00281874d0e757599e2a7ea9a21c0`\n' +
  //       '\n' +
  //       '**Native Balance on Base:**\n' +
  //       'The first (and only) delegator has **0.002286052172436296 ETH** on the Base blockchain.'
  //   }
  // ]
}

async function delegatorUsage() {
  console.log('====== SHOWING DELEGATOR USAGE ======');

  const anthropic = new Anthropic();

  // Delegatee can identify with a SIWE similarly to delegatees or use their client JWT
  const jwt = DELEGATOR_JWT;
  const msg = await anthropic.beta.messages.create({
    betas: ['mcp-client-2025-04-04'],
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    mcp_servers: [
      {
        type: 'url',
        url: `${VINCENT_MCP_BASE_URL}/mcp`, // The URL of the MCP server
        name: 'vincent-app',
        tool_configuration: {
          enabled: true,
        },
        authorization_token: jwt, // MCP Server receives headers['authorization'] = `Bearer ${jwt}`
        // Alternatively, you can pass the SIWE or JWT as query params. But using headers is preferred
        // url: `${VINCENT_MCP_BASE_URL}/mcp?jwt=${jwt}`,
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Tell me which blockchain tools do I have available',
          },
        ],
      },
    ],
  });

  console.log(msg.content);
  // Output:
  // [
  //   {
  //     type: 'text',
  //     text: 'Based on the tools available to me, you have access to the following blockchain tools for interacting with Uniswap V3 and ERC20 tokens:\n' +
  //       '\n' +
  //       '## **Balance Checking Tools:**\n' +
  //       '1. **Native Balance Checker** - Get the native token balance (like ETH) for a PKP address on any chain\n' +
  //       '2. **ERC20 Balance Checker** - Get the balance of any ERC20 token for a PKP address on any chain\n' +
  //       '\n' +
  //       '## **Token Approval Tools:**\n' +
  //       '3. **ERC20 Allowance Checker** - Check how much of an ERC20 token a spender (like Uniswap router) is allowed to spend\n' +
  //       '4. **ERC20 Approval** - Approve an ERC20 token for spending by the Uniswap V3 Router contract\n' +
  //       '\n' +
  //       '## **Trading Tools:**\n' +
  //       '5. **Uniswap V3 Swap** - Execute token swaps on Uniswap V3, selling a specific amount of one token to get another token\n' +
  //       '\n' +
  //       'These tools work together to enable a complete Uniswap trading workflow:\n' +
  //       '- Check balances to see what tokens you have available\n' +
  //       '- Check/set allowances so Uniswap can spend your tokens\n' +
  //       '- Execute swaps to trade between different tokens\n' +
  //       '\n' +
  //       'The tools support multiple blockchains (you specify the chain ID) and work with PKP (Programmable Key Pair) addresses. All tools require RPC URLs for blockchain connectivity.\n' +
  //       '\n' +
  //       'Would you like me to help you use any of these tools for a specific task?'
  //   }
  // ]
}

async function main() {
  await delegateeUsage();
  await delegatorUsage();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
