/**
 * Server implementation for Vincent applications using the Model Context Protocol
 *
 * This module provides functionality to create and configure an MCP server for Vincent applications.
 *
 * @module mcp/server
 * @category Vincent MCP SDK
 */
import { getVincentToolClient, utils } from '@lit-protocol/vincent-app-sdk';
import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  CallToolResult,
  ServerRequest,
  ServerNotification,
} from '@modelcontextprotocol/sdk/types.js';
import { Signer } from 'ethers';
import { type ZodRawShape } from 'zod';

import { buildMcpToolName, VincentAppDef, VincentAppDefSchema } from './definitions';

const { getDelegatorsAgentPkpAddresses } = utils;

/**
 * Configuration for a Vincent MCP server regarding its delegation mode.
 *
 * @property {Signer} delegateeSigner - The signer for the delegatee, used to execute tools.
 * @property {string | undefined} delegatorPkpEthAddress - The PKP Ethereum address of the delegator. If undefined, the server operates in delegatee-only mode.
 */
export interface DelegationMcpServerConfig {
  delegateeSigner: Signer;
  delegatorPkpEthAddress: string | undefined;
}

/**
 * Registers Vincent tools with an MCP server.
 *
 * This function iterates through the tools defined in the Vincent application definition,
 * dynamically imports each tool's package, and registers it with the provided MCP server.
 * It configures each tool to be executed with the delegatee's signer and handles parameter descriptions.
 *
 * @param {VincentAppDef} vincentAppDef - The Vincent application definition containing the tools to register.
 * @param {McpServer} server - The MCP server instance to register the tools with.
 * @param {DelegationMcpServerConfig} config - The server configuration, including the delegatee signer.
 * @private
 * @hidden
 */
async function registerVincentTools(
  vincentAppDef: VincentAppDef,
  server: McpServer,
  config: DelegationMcpServerConfig
) {
  const { delegateeSigner, delegatorPkpEthAddress } = config;

  for (const vincentAppToolDef of Object.values(vincentAppDef.tools)) {
    const bundledVincentTool = vincentAppToolDef.bundledVincentTool;
    const {
      vincentTool: { packageName, toolDescription, toolParamsSchema },
    } = bundledVincentTool;

    const toolClient = getVincentToolClient({
      ethersSigner: delegateeSigner,
      bundledVincentTool: bundledVincentTool,
    });

    // Add available descriptions to each param
    const toolParamsSchemaShape = { ...toolParamsSchema.shape };
    Object.entries(vincentAppToolDef.parameters || {}).forEach(([key, param]) => {
      if (param.description) {
        toolParamsSchemaShape[key] = toolParamsSchemaShape[key].describe(param.description);
      }
    });

    server.registerTool(
      buildMcpToolName(vincentAppDef, vincentAppToolDef.name || packageName),
      {
        description: vincentAppToolDef.description || toolDescription || '', // First versions on the tool SDK did not have a description
        inputSchema: toolParamsSchemaShape,
      },
      async (
        args: ZodRawShape,
        extra: RequestHandlerExtra<ServerRequest, ServerNotification>
      ): Promise<CallToolResult> => {
        const precheckResult = await toolClient.precheck(args, {
          delegatorPkpEthAddress: delegatorPkpEthAddress!,
        });
        if ('error' in precheckResult || !precheckResult.success) {
          throw new Error(
            JSON.stringify(
              {
                success: precheckResult.success,
                error: precheckResult.error,
                result: precheckResult.result,
              },
              null,
              2
            )
          );
        }

        const executeResult = await toolClient.execute(args, {
          delegatorPkpEthAddress: delegatorPkpEthAddress!,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(executeResult),
            },
          ],
        };
      }
    );
  }
}

/**
 * Creates an MCP server for a Vincent application
 *
 * This function configures an MCP server based on the Vincent application definition provided.
 * Each Vincent tool is registered with the server and configured to use the provided delegatee signer for execution.
 * Extra tools to get delegator and app info are added.
 *
 * Tool packages MUST be installed before calling this function as it will try to import them on demand.
 *
 * Check (MCP Typescript SDK docs)[https://github.com/modelcontextprotocol/typescript-sdk] for more details on MCP server definition.
 *
 * @param {VincentAppDef} vincentAppDefinition - The Vincent application definition containing the tools to register
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
 *     '@organization/some_tool': {
 *       name: 'myTool',
 *       description: 'A tool that does something',
 *       parameters: [
 *         {
 *           name: 'param1',
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
  const vincentAppDef = VincentAppDefSchema.parse(vincentAppDefinition);

  const server = new McpServer({
    name: vincentAppDef.name,
    version: vincentAppDef.version,
  });

  if (delegatorPkpEthAddress) {
    // Add as resource and tool to maximize compatibility (some LLM clients may not support resources)
    server.registerResource(
      buildMcpToolName(vincentAppDef, 'current-agent-eth-address'),
      'agent://current/eth-address',
      {
        description: `Resource to get current agent eth address in use for Vincent App ${vincentAppDef.id}/${vincentAppDef.version}.`,
      },
      async (uri: URL) => ({
        contents: [
          {
            uri: uri.href,
            text: delegatorPkpEthAddress,
          },
        ],
      })
    );
    server.registerTool(
      buildMcpToolName(vincentAppDef, 'get-current-agent-eth-address'),
      {
        description: `Tool to get current agent eth address in use for Vincent App ${vincentAppDef.id}/${vincentAppDef.version}.`,
      },
      async () => ({
        content: [
          {
            type: 'text',
            text: delegatorPkpEthAddress,
          },
        ],
      })
    );
  } else {
    // In delegatee mode (no delegator), user has to be able to fetch its delegators and select which one to operate on behalf of
    server.registerTool(
      buildMcpToolName(vincentAppDef, 'get-delegators-eth-addresses'),
      {
        description: `Tool to get the delegators pkp Eth addresses for the ${vincentAppDef.name} Vincent App.`,
      },
      async () => {
        const appId = parseInt(vincentAppDef.id, 10);
        const appVersion = parseInt(vincentAppDef.version, 10);

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

  const appInfo = {
    id: vincentAppDef.id,
    name: vincentAppDef.name,
    version: vincentAppDef.version,
    description: vincentAppDef.description,
  };
  // Add as resource and tool to maximize compatibility (some LLM clients may not support resources)
  server.registerResource(
    buildMcpToolName(vincentAppDef, 'current-vincent-app-info'),
    `app://${vincentAppDef.id}/${vincentAppDef.version}/info`,
    {
      description: `Resource to get the Vincent App ${vincentAppDef.id}/${vincentAppDef.version} info.`,
    },
    async (uri: URL) => ({
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(appInfo),
        },
      ],
    })
  );
  server.registerTool(
    buildMcpToolName(vincentAppDef, 'get-current-vincent-app-info'),
    {
      description: `Tool to get the Vincent App ${vincentAppDef.id}/${vincentAppDef.version} info.`,
    },
    async () => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify(appInfo),
        },
      ],
    })
  );

  // Fetch and install tool packages, then load them as Vincent MCP Tools
  await registerVincentTools(vincentAppDef, server, config);

  return server;
}
