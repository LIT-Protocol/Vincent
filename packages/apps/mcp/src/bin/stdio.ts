#!/usr/bin/env node
/**
 * Standard I/O server implementation for Vincent MCP
 *
 * This module provides a standard I/O (stdio) server implementation for the Model Context Protocol (MCP).
 * It creates a server that communicates through standard input and output streams, making it suitable
 * for integration with command-line tools, language models, and other processes that can communicate
 * via stdio.
 *
 * The server loads a Vincent application definition from a JSON file and creates
 * an MCP server with extended capabilities for that application. It then exposes
 * the server via stdio following the MCP protocol.
 *
 * @module stdio
 * @category Vincent MCP
 */

import '../bootstrap'; // Bootstrap console.log to a log file
import { ethers } from 'ethers';

import { LIT_EVM_CHAINS } from '@lit-protocol/constants';
import { disconnectVincentToolClients } from '@lit-protocol/vincent-app-sdk';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { getVincentAppDef } from '../appDefBuilder';
import { env } from '../env';
import { getServer } from '../server';

const { VINCENT_DELEGATEE_PRIVATE_KEY } = env;

const delegateeSigner = new ethers.Wallet(
  VINCENT_DELEGATEE_PRIVATE_KEY,
  new ethers.providers.StaticJsonRpcProvider(LIT_EVM_CHAINS.yellowstone.rpcUrls[0]),
);

/**
 * Main function to initialize and run the stdio MCP server
 *
 * This function performs the following steps:
 * 1. Creates a stdio transport for the MCP protocol
 * 2. Loads the Vincent application definition from a JSON file
 * 3. Creates an MCP server with extended capabilities for the application
 * 4. Connects the server to the stdio transport
 * 5. Logs a message to stderr indicating the server is running
 *
 * @internal
 */
async function main() {
  const vincentAppDef = await getVincentAppDef();

  const server = await getServer(vincentAppDef, {
    delegateeSigner,
    delegatorPkpEthAddress: undefined, // STDIO is ALWAYS running in a local environment
  });
  await server.connect(new StdioServerTransport());
  console.error('Vincent MCP Server running in STDIO mode'); // console.log is used for messaging the parent process

  function gracefulShutdown() {
    console.error('🔌 Disconnecting from Lit Network...');

    disconnectVincentToolClients();

    console.error('🛑 Vincent MCP Server has been closed.');
    process.exit(0);
  }
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
}

main().catch((error) => {
  console.error('Fatal error starting MCP server in STDIO mode:', error);
  process.exit(1);
});
