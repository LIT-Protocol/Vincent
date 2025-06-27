/**
 * Server implementation for Vincent applications using the Model Context Protocol
 *
 * This module provides functionality to create and configure an MCP server for Vincent applications.
 *
 * @module mcp/server
 * @category Vincent MCP SDK
 */

import { LIT_NETWORK } from '@lit-protocol/constants';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import type { LitNodeClientConfig } from '@lit-protocol/types';
import { utils } from '@lit-protocol/vincent-app-sdk';
import type { Implementation } from '@modelcontextprotocol/sdk/types.js';
import type { ServerOptions } from '@modelcontextprotocol/sdk/server/index.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Signer } from 'ethers';

import {
  buildMcpToolName,
  buildMcpParamDefinitions,
  buildMcpToolCallback,
  VincentAppDef,
  VincentAppDefSchema,
  VincentToolDefWithIPFS,
} from './definitions';

const { getDelegatorsAgentPkpAddresses } = utils;

export interface DelegationMcpServerConfig {
  delegateeSigner: Signer;
  delegatorPkpEthAddress: string | undefined;
}

export interface LitServerOptions extends ServerOptions {
  litNodeClientOptions: LitNodeClientConfig;
}

export class VincentMcpServer extends McpServer {
  litNodeClient: LitNodeClient;

  constructor(serverInfo: Implementation, options?: LitServerOptions) {
    super(serverInfo, options);

    const litNodeClientOptions = options?.litNodeClientOptions || {};
    this.litNodeClient = new LitNodeClient({
      debug: true,
      litNetwork: LIT_NETWORK.Datil,
      ...litNodeClientOptions,
    });
  }

  override async connect(transport: Transport): Promise<void> {
    await super.connect(transport);

    await this.litNodeClient.connect();
  }

  override async close(): Promise<void> {
    await this.litNodeClient.disconnect();
  }

  vincentTool(
    name: string,
    toolData: VincentToolDefWithIPFS,
    delegateeSigner: Signer,
    delegatorPkpEthAddress?: string
  ) {
    this.tool(
      name,
      toolData.description,
      buildMcpParamDefinitions(toolData.parameters, !delegatorPkpEthAddress),
      buildMcpToolCallback(this.litNodeClient, delegateeSigner, delegatorPkpEthAddress, toolData)
    );
  }
}

/**
 * Creates an MCP server for a Vincent application
 *
 * This function configures an MCP server with the tools defined in the Vincent application definition.
 * Each tool is registered with the server and configured to use the provided delegatee signer for execution.
 *
 * Check (MCP Typescript SDK docs)[https://github.com/modelcontextprotocol/typescript-sdk] for more details on MCP server definition.
 *
 * @param vincentAppDefinition - The Vincent application definition containing the tools to register
 * @param {DelegationMcpServerConfig} config - The server configuration
 * @returns A configured MCP server instance
 *
 * @example
 * ```typescript
 * import { ethers } from 'ethers';
 * import { getVincentAppServer, VincentAppDef } from '@lit-protocol/vincent-mcp-sdk';
 * import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
 *
 * // Create a signer
 * const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_KEY');
 * const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);
 *
 * // Define your Vincent application
 * const appDef: VincentAppDef = {
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
 * const server = await getVincentAppServer(wallet, appDef);
 *
 * // Add transport to expose the server
 * const stdio = new StdioServerTransport();
 * await server.connect(stdio);
 * ```
 */
export async function getVincentAppServer(
  vincentAppDefinition: VincentAppDef,
  config: DelegationMcpServerConfig
): Promise<McpServer> {
  const { delegatorPkpEthAddress } = config;
  const _vincentAppDefinition = VincentAppDefSchema.parse(vincentAppDefinition);

  const server = new VincentMcpServer({
    name: _vincentAppDefinition.name,
    version: _vincentAppDefinition.version,
  });

  if (delegatorPkpEthAddress) {
    server.tool(
      buildMcpToolName(_vincentAppDefinition, 'get-current-agent-pkp-address'),
      `Tool to get your agent pkp eth address in use for the ${_vincentAppDefinition.name} Vincent App MCP.`,
      async () => {
        return {
          content: [
            {
              type: 'text',
              text: delegatorPkpEthAddress,
            },
          ],
        };
      }
    );
  } else {
    // In delegatee mode (no delegator), user has to be able to fetch its delegators and select which one to operate on behalf of
    server.tool(
      buildMcpToolName(_vincentAppDefinition, 'get-delegators-eth-addresses'),
      `Tool to get the delegators pkp Eth addresses for the ${_vincentAppDefinition.name} Vincent App.`,
      async () => {
        const appId = parseInt(_vincentAppDefinition.id, 10);
        const appVersion = parseInt(_vincentAppDefinition.version, 10);

        const delegatorsPkpEthAddresses = await getDelegatorsAgentPkpAddresses(appId, appVersion);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(delegatorsPkpEthAddresses),
            },
          ],
        };
      }
    );
  }

  server.tool(
    buildMcpToolName(_vincentAppDefinition, 'get-current-vincent-app-info'),
    `Tool to get the ${_vincentAppDefinition.name} Vincent App info.`,
    async () => {
      const appInfo = {
        id: _vincentAppDefinition.id,
        name: _vincentAppDefinition.name,
        version: _vincentAppDefinition.version,
        description: _vincentAppDefinition.description,
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(appInfo),
          },
        ],
      };
    }
  );

  Object.entries(_vincentAppDefinition.tools).forEach(([toolIpfsCid, tool]) => {
    server.vincentTool(
      buildMcpToolName(_vincentAppDefinition, tool.name),
      { ipfsCid: toolIpfsCid, ...tool },
      config.delegateeSigner,
      config.delegatorPkpEthAddress
    );
  });

  return server;
}
