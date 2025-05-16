import fs from 'node:fs';

import { mcp } from '@lit-protocol/vincent-sdk';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { env } from './env';
import { getServer } from './server';

const { VINCENT_APP_JSON_DEFINITION } = env;
const { VincentAppDefSchema } = mcp;

async function main() {
  const stdioTransport = new StdioServerTransport();
  const vincentAppJson = fs.readFileSync(VINCENT_APP_JSON_DEFINITION, { encoding: 'utf8' });
  const vincentAppDef = VincentAppDefSchema.parse(JSON.parse(vincentAppJson));

  const server = getServer(vincentAppDef);
  await server.connect(stdioTransport);
  console.error('Vincent MCP Server running in stdio mode'); // console.log is used for messaging the parent process
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
