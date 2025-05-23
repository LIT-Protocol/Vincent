/**
 * Server creation utilities for Vincent MCP
 *
 * This module provides functionality to create and configure an MCP server
 * for Vincent applications with extended capabilities. It uses the Vincent SDK
 * to create a base server and then extends it with additional functionality.
 *
 * @module server
 * @category Vincent MCP
 */

import { LIT_EVM_CHAINS } from '@lit-protocol/constants';
import { mcp } from '@lit-protocol/vincent-sdk';
import { ethers } from 'ethers';

import { env } from './env';
import { extendVincentServer } from './extensions';

const { VINCENT_DELEGATEE_PRIVATE_KEY } = env;
const { getVincentAppServer } = mcp;

/**
 * Creates an extended MCP server for a Vincent application
 *
 * This function creates an MCP server for a Vincent application and extends it
 * with additional functionality. It uses the delegatee private key from the
 * environment to create a signer that can execute Vincent tools on behalf of users.
 *
 * The server is created using the Vincent SDK's `getVincentAppServer` function
 * and then extended with additional capabilities using the `extendVincentServer` function.
 *
 * @param vincentAppDef - The Vincent application definition containing the tools to register
 * @returns A configured and extended MCP server instance
 *
 * @example
 * ```typescript
 * import { mcp } from '@lit-protocol/vincent-sdk';
 * import { getServer } from '@lit-protocol/vincent-mcp';
 * import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
 *
 * // Define your Vincent application
 * const appDef: mcp.VincentAppDef = {
 *   id: '8462368',
 *   name: 'My Vincent App',
 *   version: '1',
 *   tools: {
 *     // Your tools here
 *   }
 * };
 *
 * // Create the extended MCP server
 * const server = getServer(appDef);
 *
 * // Add transport to expose the server
 * const stdio = new StdioServerTransport();
 * await server.connect(stdio);
 * ```
 */
export function getServer(vincentAppDef: mcp.VincentAppDef) {
  const delegateeSigner = new ethers.Wallet(
    VINCENT_DELEGATEE_PRIVATE_KEY,
    new ethers.providers.StaticJsonRpcProvider(LIT_EVM_CHAINS.yellowstone.rpcUrls[0]),
  );

  const server = getVincentAppServer(delegateeSigner, vincentAppDef);
  extendVincentServer(server, vincentAppDef, delegateeSigner);

  return server;
}
