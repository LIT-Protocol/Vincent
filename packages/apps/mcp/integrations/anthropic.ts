import Anthropic from '@anthropic-ai/sdk';

async function main() {
  const anthropic = new Anthropic();

  const msg = await anthropic.beta.messages.create({
    betas: ['mcp-client-2025-04-04'],
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    mcp_servers: [
      {
        type: 'url',
        url: process.env.VINCENT_MCP_URL!, // The URL of the MCP server
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
  //     id: 'mcptoolu_01H5o5mSJvuRNKd5avzcHoUu',
  //     name: 'get-delegators-info',
  //     input: {},
  //     server_name: 'vincent-app'
  //   },
  //   {
  //     type: 'mcp_tool_result',
  //     tool_use_id: 'mcptoolu_01H5o5mSJvuRNKd5avzcHoUu',
  //     is_error: false,
  //     content: [ [Object] ]
  //   },
  //   {
  //     type: 'text',
  //     text: "Now I'll check the native balance for the first delegator on Base blockchain (chain ID 8453):"
  //   },
  //   {
  //     type: 'mcp_tool_use',
  //     id: 'mcptoolu_01STBrhvK9kc34qFMmMM1zLr',
  //     name: 'native-balance',
  //     input: {
  //       chainId: '8453',
  //       pkpEthAddress: '0x2b0e8EBA44FE6Fdc87dE6ADfa3367417D97Fd22f'
  //     },
  //     server_name: 'vincent-app'
  //   },
  //   {
  //     type: 'mcp_tool_result',
  //     tool_use_id: 'mcptoolu_01STBrhvK9kc34qFMmMM1zLr',
  //     is_error: false,
  //     content: [ [Object] ]
  //   },
  //   {
  //     type: 'text',
  //     text: 'Here are your results:\n' +
  //       '\n' +
  //       '**Your Delegators:**\n' +
  //       '- **Token ID:** 0x25cde13de35b4ae0bdde4f1a3c910eae236201e8776a182ca0092fcf9495004e\n' +
  //       '- **ETH Address:** 0x2b0e8EBA44FE6Fdc87dE6ADfa3367417D97Fd22f\n' +
  //       '- **Public Key:** 0x0490f9499c818c3ca1bc7b04fcaa8ceea9f1e3861e7bdddcbbd968a7eb2b74450f98434c0f71a18b2b28fdd2b79b9452bb9cd00281874d0e757599e2a7ea9a21c0\n' +
  //       '\n' +
  //       '**Native Balance on Base:**\n' +
  //       'Your first delegator (0x2b0e8EBA44FE6Fdc87dE6ADfa3367417D97Fd22f) has **0.002489682563403434 ETH** on the Base blockchain.'
  //   }
  // ]
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
