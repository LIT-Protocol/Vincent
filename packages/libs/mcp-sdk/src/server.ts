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
import { npxImport } from 'npx-import';
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
  const packagesToInstall = Object.entries(vincentAppDef.tools).map(([toolNpmName, pkgInfo]) => {
    return `${toolNpmName}@${pkgInfo.version}`;
  });
  const toolsPkgs = (await npxImport(packagesToInstall)) as any[];

  const { delegateeSigner, delegatorPkpEthAddress } = config;

  for (const [toolPackage, toolData] of Object.entries(vincentAppDef.tools)) {
    const tool = toolsPkgs.find(
      (tool) => toolPackage === tool.bundledVincentTool.vincentTool.packageName
    );

    const bundledVincentTool = tool.bundledVincentTool;
    const { vincentTool } = bundledVincentTool;
    const { packageName, toolDescription, toolParamsSchema } = vincentTool;

    const toolClient = getVincentToolClient({
      ethersSigner: delegateeSigner,
      bundledVincentTool: bundledVincentTool,
    });

    // Add available descriptions to each param
    Object.entries(toolData.parameters || {}).forEach(([key, param]) => {
      if (param.description) {
        toolParamsSchema.shape[key] = toolParamsSchema.shape[key].describe(param.description);
      }
    });

    server.tool(
      buildMcpToolName(vincentAppDef, toolData.name || packageName),
      toolData.description || toolDescription || '',
      toolParamsSchema.shape,
      async (
        args: ZodRawShape,
        extra: RequestHandlerExtra<ServerRequest, ServerNotification>
      ): Promise<CallToolResult> => {
        const precheckResult = await toolClient.precheck(args, {
          delegatorPkpEthAddress: delegatorPkpEthAddress!,
        });
        if (!precheckResult.success) {
          throw new Error(JSON.stringify(precheckResult.result, null, 2));
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
    server.tool(
      buildMcpToolName(vincentAppDef, 'get-current-agent-pkp-address'),
      `Tool to get your agent pkp eth address in use for the ${vincentAppDef.name} Vincent App MCP.`,
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
      buildMcpToolName(vincentAppDef, 'get-delegators-eth-addresses'),
      `Tool to get the delegators pkp Eth addresses for the ${vincentAppDef.name} Vincent App.`,
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

  server.tool(
    buildMcpToolName(vincentAppDef, 'get-current-vincent-app-info'),
    `Tool to get the ${vincentAppDef.name} Vincent App info.`,
    async () => {
      const appInfo = {
        id: vincentAppDef.id,
        name: vincentAppDef.name,
        version: vincentAppDef.version,
        description: vincentAppDef.description,
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

  // Fetch and install tool packages, then load them as Vincent MCP Tools
  await registerVincentTools(vincentAppDef, server, config);

  return server;
}
