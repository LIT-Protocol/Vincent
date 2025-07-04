/**
 * Server implementation for Vincent applications using the Model Context Protocol
 *
 * This module provides functionality to create and configure an MCP server for Vincent applications.
 *
 * @module mcp/server
 * @category Vincent MCP SDK
 */
import { exec } from 'node:child_process';

import { getVincentToolClient, utils } from '@lit-protocol/vincent-app-sdk';
import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  CallToolResult,
  ServerRequest,
  ServerNotification,
} from '@modelcontextprotocol/sdk/types.js';
import { Signer } from 'ethers';
import which from 'which';
import { type ZodRawShape } from 'zod';

import {
  buildMcpToolName,
  VincentAppDef,
  VincentAppDefSchema,
  VincentAppTools,
} from './definitions';

const { getDelegatorsAgentPkpAddresses } = utils;

// Keeps track of packages ("<name>@<version>") installed during this process so we don’t
// reinstall them when `installToolPackages` is called again.
const installedToolCache = new Set<string>();

export interface DelegationMcpServerConfig {
  delegateeSigner: Signer;
  delegatorPkpEthAddress: string | undefined;
}

async function installToolPackages(tools: VincentAppTools) {
  return await new Promise<void>((resolve, reject) => {
    const allPackages = Object.entries(tools).map(([toolNpmName, pkgInfo]) => {
      return `${toolNpmName}@${pkgInfo.version}`;
    });

    // Install only what hasn’t been installed during this runtime
    const packagesToInstall = allPackages.filter((p) => !installedToolCache.has(p));

    if (packagesToInstall.length === 0) {
      console.log('All tool packages already installed, skipping install.');
      return resolve();
    }

    console.log(`Installing tool packages ${packagesToInstall.join(', ')}...`);
    // When running in the Vincent repo ecosystem, pnpm must be used to avoid conflicts with nx and pnpm configurations
    // On `npx` commands, pnpm might not even be available. We fall back to having `npm` in the running machine (having `npx` implies that)
    const mgr = which.sync('pnpm', { nothrow: true }) ? 'pnpm' : 'npm';
    const command =
      mgr === 'npm'
        ? `npm i ${packagesToInstall.join(' ')} --no-save --production --ignore-scripts`
        : `pnpm i ${packagesToInstall.join(' ')} --save-exact --no-lockfile --ignore-scripts`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(error);
        reject(error);
        return;
      }
      // stderr has the debugger logs so it seems to fail when executing with the debugger
      // if (stderr) {
      //   console.error(stderr);
      //   reject(stderr);
      //   return;
      // }

      // Update cache with newly installed packages
      packagesToInstall.forEach((p) => installedToolCache.add(p));

      console.log(`Successfully installed ${packagesToInstall.join(', ')}`);
      resolve();
    });
  });
}

async function registerVincentTools(
  vincentAppDef: VincentAppDef,
  server: McpServer,
  config: DelegationMcpServerConfig
) {
  const { delegateeSigner, delegatorPkpEthAddress } = config;

  for await (const [toolPackage, toolData] of Object.entries(vincentAppDef.tools)) {
    console.log(`Loading tool package ${toolPackage}...`);
    const tool = require(toolPackage); // This works
    // const tool = await import(toolPackage); // TODO This doesn't work
    console.log(`Successfully loaded tool package ${toolPackage}`);

    const bundledVincentTool = tool.bundledVincentTool;
    const { vincentTool } = bundledVincentTool;
    const {
      toolParamsSchema: { shape: paramsSchema },
    } = vincentTool;

    const toolClient = getVincentToolClient({
      ethersSigner: delegateeSigner,
      bundledVincentTool: bundledVincentTool,
    });

    // Add available descriptions to each param
    toolData.parameters?.forEach((param) => {
      if (param.description) {
        paramsSchema[param.name] = paramsSchema[param.name].describe(param.description);
      }
    });

    server.tool(
      buildMcpToolName(vincentAppDef, toolData.name || toolPackage),
      toolData.description || '',
      paramsSchema,
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
  await installToolPackages(vincentAppDef.tools);
  await registerVincentTools(vincentAppDef, server, config);

  return server;
}
