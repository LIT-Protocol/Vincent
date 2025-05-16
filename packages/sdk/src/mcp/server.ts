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
