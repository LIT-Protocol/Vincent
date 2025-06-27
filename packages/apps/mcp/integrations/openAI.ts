import { LIT_EVM_CHAINS } from '@lit-protocol/constants';
import OpenAI from 'openai';
import { ethers } from 'ethers';

const { DELEGATOR_JWT, VINCENT_DELEGATEE_PRIVATE_KEY, VINCENT_MCP_BASE_URL } = process.env;

const YELLOWSTONE = LIT_EVM_CHAINS.yellowstone;

async function delegateeUsage() {
  console.log('====== SHOWING DELEGATEE USAGE ======');

  const client = new OpenAI();

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

  const response = await client.responses.create({
    model: 'gpt-4.1',
    tools: [
      {
        type: 'mcp',
        server_label: 'vincent-app',
        require_approval: 'never',
        server_url: `${VINCENT_MCP_BASE_URL}/mcp`, // The URL of the MCP server
        headers: {
          authorization: `SIWE-V1 b64message="${base64Message}" signature="${signature}"`,
        },
        // Alternatively, you can pass the SIWE signature and message (base64 encoded) as query params. But using the authorization header is preferred
        // server_url: `${VINCENT_MCP_BASE_URL}/mcp?b64message=${base64Message}&signature=${signature}`,
      },
    ],
    input:
      'Check who my delegators are and then check the native balance in base blockchain of the first one.',
  });

  console.log(response.output_text);
  // Output:
  // Your delegators are as follows:
  //
  // 1. ETH Address: 0x2b0e8EBA44FE6Fdc87dE6ADfa3367417D97Fd22f
  //    - Token ID: 0x25cde13de35b4ae0bdde4f1a3c910eae236201e8776a182ca0092fcf9495004e
  //    - Public Key: 0x0490f9499c818c3ca1bc7b04fcaa8ceea9f1e3861e7bdddcbbd968a7eb2b74450f98434c0f71a18b2b28fdd2b79b9452bb9cd00281874d0e757599e2a7ea9a21c0
  //
  // The native balance on the Base blockchain for the first delegator (0x2b0e8EBA44FE6Fdc87dE6ADfa3367417D97Fd22f) is:
  // - 0.002286052172436296 ETH
  //
  // Let me know if you need more information or want to take any action!
}

async function delegatorUsage() {
  console.log('====== SHOWING DELEGATOR USAGE ======');

  const client = new OpenAI();

  // Delegatee can identify with a SIWE similarly to delegatees or use their client JWT
  const jwt = DELEGATOR_JWT;
  const response = await client.responses.create({
    model: 'gpt-4.1',
    tools: [
      {
        type: 'mcp',
        server_label: 'vincent-app',
        require_approval: 'never',
        server_url: `${VINCENT_MCP_BASE_URL}/mcp`, // The URL of the MCP server
        headers: {
          // The jwt can be passed as an authorization header or the custom vincent jwt header
          authorization: `Bearer ${jwt}`,
        },
        // Alternatively, you can pass the SIWE or JWT as query params. But using headers is preferred
        // server_url: `${VINCENT_MCP_BASE_URL}/mcp?jwt=${jwt}`,
      },
    ],
    input: 'Tell me which blockchain tools do I have available',
  });

  console.log(response.output_text);
  // Output:
  // Here are the blockchain tools you have available through this interface:
  //
  // ---
  //
  // ## 1. **Uniswap Swap (via MCP Vincent)**
  // Interact with Uniswap V3/V4 and perform the following operations:
  //
  // - **ERC20 Token Approval**
  //   - Approve a specific amount of an ERC20 token to be spent by the Uniswap Router.
  //
  // - **Execute Uniswap Swap**
  //   - Swap a specified amount of one ERC20 token for another via Uniswap.
  //
  // - **Check Native Balance**
  //   - Query the native currency (like ETH on Ethereum) balance for a given address on a specific chain.
  //
  // - **Check ERC20 Balance**
  //   - Query the balance of a specific ERC20 token for a given address.
  //
  // - **Check ERC20 Allowance**
  //   - Check how much of a given ERC20 token an address has approved for spending by a specified spender (e.g., Uniswap Router).
  //
  // ---
  //
  // ### Supported Blockchains*
  // These tools generally work with EVM-compatible chains like Ethereum, Base, and others (where Uniswap operates).
  //
  // ---
  //
  // ### Example Use Cases:
  // - Approve and swap tokens (e.g., trade USDC for WETH on Base or Ethereum).
  // - Check balances for strategy or wallet monitoring.
  // - View or manage token allowances.
  //
  // ---
  //
  // **If you have a specific workflow or question, just let me know what you want to accomplish and I’ll guide you!**
}

async function main() {
  await delegateeUsage();
  await delegatorUsage();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
