import OpenAI from 'openai';

async function main() {
  const client = new OpenAI();

  const response = await client.responses.create({
    model: 'gpt-4.1',
    tools: [
      {
        type: 'mcp',
        server_label: 'vincent-app',
        server_url: process.env.VINCENT_MCP_URL!, // The URL of the MCP server
        require_approval: 'never',
      },
    ],
    input:
      'Check who my delegators are and then check the native balance in base blockchain of the first one.',
  });

  console.log(response.output_text);
  // Output:
  // You have one delegator:
  //
  // - ETH Address: 0x2b0e8EBA44FE6Fdc87dE6ADfa3367417D97Fd22f
  //
  // The native balance for this delegator on the Base blockchain is 0.00248968 ETH.
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
