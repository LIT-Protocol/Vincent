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

import { getVincentAppServer, VincentAppDef } from '@lit-protocol/vincent-mcp-sdk';
import { Signer } from 'ethers';

import { extendVincentServer } from './extensions';

export interface ServerConfig {
  delegateeSigner: Signer;
  delegatorPkpEthAddress: string | undefined;
}

/**
 * Creates an extended MCP server for a Vincent application
 *
 * This function creates an MCP server for a Vincent application and extends it
 * with additional functionality. It uses the delegatee private key from the
 * environment to create a signer that can execute Vincent abilities on behalf of users.
 *
 * The server is created using the Vincent SDK's `getVincentAppServer` function
 * and then extended with additional capabilities using the `extendVincentServer` function.
 *
 * @param vincentAppDef - The Vincent application definition containing the abilities to register
 * @param {ServerConfig} serverConfig - The server configuration
 * @returns A configured and extended MCP server instance
 *
 * @example
 * ```typescript
 * import { getVincentAppServer, VincentAppDef } from '@lit-protocol/vincent-mcp-sdk';
 * import { getServer } from '@lit-protocol/vincent-mcp-server';
 * import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
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
 * // Create the extended MCP server
 * const server = getServer(appDef);
 *
 * // Add transport to expose the server
 * const stdio = new StdioServerTransport();
 * await server.connect(stdio);
 * ```
 */
export async function getServer(vincentAppDef: VincentAppDef, serverConfig: ServerConfig) {
  const { delegateeSigner, delegatorPkpEthAddress } = serverConfig;

  const server = await getVincentAppServer(vincentAppDef, {
    delegateeSigner,
    delegatorPkpEthAddress,
  });
  extendVincentServer(server, vincentAppDef, delegateeSigner);

  return server;
}
