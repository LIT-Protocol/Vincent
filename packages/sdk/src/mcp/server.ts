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

import {
  buildParamDefinitions,
  buildVincentActionCallback,
  VincentAppDef,
  VincentAppDefSchema,
  VincentToolDefWithIPFS,
} from './definitions';
import { getDelegatorsAgentPkpInfo } from '../utils/delegation';

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
  const vincentToolCallback = buildVincentActionCallback(vincentToolDefWithIPFS);

  return async (
    args: ZodRawShape,
    _extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): Promise<CallToolResult> => {
    const response = await vincentToolCallback(delegateeSigner, args);

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
  const _vincentAppDefinition = VincentAppDefSchema.parse(vincentAppDefinition);

  const server = new McpServer({
    name: _vincentAppDefinition.name,
    version: _vincentAppDefinition.version,
  });

  // Tool to get this app delegators
  server.tool(
    `get-${_vincentAppDefinition.name}-${_vincentAppDefinition.version}-delegators-info`,
    `Tool to get the delegators info for the ${_vincentAppDefinition.name} Vincent App. Info includes the PKP token ID, ETH address, and public key for each delegator.`,
    async () => {
      const appId = parseInt(_vincentAppDefinition.id, 10);
      const appVersion = parseInt(_vincentAppDefinition.version, 10);

      const delegatorsPkpInfo = await getDelegatorsAgentPkpInfo(appId, appVersion);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(delegatorsPkpInfo),
          },
        ],
      };
    }
  );

  Object.entries(_vincentAppDefinition.tools).forEach(([toolIpfsCid, tool]) => {
    server.tool(
      tool.name,
      tool.description,
      buildParamDefinitions(tool.parameters),
      buildToolCallback(delegateeSigner, { ipfsCid: toolIpfsCid, ...tool })
    );
  });

  return server;
}
