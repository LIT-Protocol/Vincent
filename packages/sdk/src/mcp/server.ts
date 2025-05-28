/**
 * Server implementation for Vincent applications using the Model Context Protocol
 *
 * This module provides functionality to create and configure an MCP server for Vincent applications.
 *
 * @module mcp/server
 * @category Vincent SDK API
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import {
  CallToolResult,
  ServerRequest,
  ServerNotification,
} from '@modelcontextprotocol/sdk/types.js';
import { ethers } from 'ethers';
import { ZodRawShape } from 'zod';

import { VincentAppDef, VincentToolDefWithIPFS, buildParamDefinitions } from './definitions';
import { getVincentToolClient } from '../tool/tool';

/**
 * Creates a callback function for handling tool execution requests
 *
 * @param delegateeSigner - The Ethereum signer used to execute the tool
 * @param vincentToolDefWithIPFS - The tool definition with its IPFS CID
 * @returns A callback function that executes the tool with the provided arguments
 * @internal
 */
function buildToolCallback(
  delegateeSigner: ethers.Signer,
  vincentToolDefWithIPFS: VincentToolDefWithIPFS
) {
  return async (
    args: ZodRawShape,
    _extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): Promise<CallToolResult> => {
    const vincentToolClient = getVincentToolClient({
      ethersSigner: delegateeSigner,
      vincentToolCid: vincentToolDefWithIPFS.ipfsCid,
    });

    const vincentToolExecutionResult = await vincentToolClient.execute(args);

    const response = JSON.parse(vincentToolExecutionResult.response as string);
    if (response.status !== 'success') {
      console.error(response);
      throw new Error(JSON.stringify(response, null, 2));
    }

    return {
      content: [
        {
          type: 'text',
          text: `Successfully executed tool ${vincentToolDefWithIPFS.name} (${vincentToolDefWithIPFS.ipfsCid}) with params ${JSON.stringify(args, null, 2)}. Response: ${JSON.stringify(response, null, 2)}.`,
        },
      ],
    };
  };
}

/**
 * Creates an MCP server for a Vincent application
 *
 * This function configures an MCP server with the tools defined in the Vincent application definition.
 * Each tool is registered with the server and configured to use the provided delegatee signer for execution.
 *
 * Check (MCP Typescript SDK docs)[https://github.com/modelcontextprotocol/typescript-sdk] for more details on MCP server definition.
 *
 * @param delegateeSigner - The Ethereum signer used to execute the tools
 * @param vincentAppDefinition - The Vincent application definition containing the tools to register
 * @returns A configured MCP server instance
 *
 * @example
 * ```typescript
 * import { ethers } from 'ethers';
 * import { mcp } from '@lit-protocol/vincent-sdk';
 * import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
 *
 * // Create a signer
 * const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_KEY');
 * const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);
 *
 * // Define your Vincent application
 * const appDef: mcp.VincentAppDef = {
 *   id: '8462368',
 *   version: '1',
 *   name: 'My Vincent App',
 *   description: 'A Vincent application that executes tools for its delegators',
 *   tools: {
 *     'QmIpfsCid1': {
 *       name: 'myTool',
 *       description: 'A tool that does something',
 *       parameters: [
 *         {
 *           name: 'param1',
 *           type: 'string',
 *           description: 'A parameter that is used in the tool to do something'
 *         }
 *       ]
 *     }
 *   }
 * };
 *
 * // Create the MCP server
 * const server = mcp.getVincentAppServer(wallet, appDef);
 *
 * // Add transport to expose the server
 * const stdio = new StdioServerTransport();
 * await server.connect(stdio);
 * ```
 */
export function getVincentAppServer(
  delegateeSigner: ethers.Signer,
  vincentAppDefinition: VincentAppDef
): McpServer {
  const server = new McpServer({
    name: vincentAppDefinition.name,
    version: vincentAppDefinition.version,
  });

  Object.entries(vincentAppDefinition.tools).forEach(([toolIpfsCid, tool]) => {
    server.tool(
      tool.name,
      tool.description,
      buildParamDefinitions(tool.parameters),
      buildToolCallback(delegateeSigner, { ipfsCid: toolIpfsCid, ...tool })
    );
  });

  return server;
}
