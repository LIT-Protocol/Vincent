#!/usr/bin/env node
/**
 * Bundled HTTP server implementation for Vincent MCP
 *
 * This module provides an HTTP server implementation for the Model Context Protocol (MCP)
 * using Express. It creates a streamable HTTP server that can handle MCP requests
 * and maintain session state across multiple requests.
 *
 * The server loads a Vincent application definition from a JSON file on demand and creates
 * an MCP server with extended capabilities for that application. It then exposes
 * the server via HTTP endpoints that follow the MCP protocol.
 *
 * @module http
 * @category Vincent MCP
 */

import { randomUUID } from 'node:crypto';

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import express, { Request, Response } from 'express';

import { getVincentDelegateeSigner } from './delegatees';
import { env } from './env';
import { getVincentAppDef } from './registry';
import { getServer } from './server';

const MCP_URL = '/:appId/:appVersion/mcp';

const { HTTP_PORT } = env;

const app = express();
app.use(express.json());

// In-memory store for transports
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

app.post(MCP_URL, async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New initialization request
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId) => {
          transports[sessionId] = transport;
        },
      });

      // Cleanup transport when closed
      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports[transport.sessionId];
        }
      };

      const authorization = (req.headers['authorization'] as string) || '';
      const [, delegateePrivateKey] = authorization.split(' ');
      if (!delegateePrivateKey) {
        throw new Error('No delegatee private key provided');
      }

      const { appId, appVersion } = req.params;
      const delegateeSigner = getVincentDelegateeSigner(delegateePrivateKey);
      const vincentAppDef = await getVincentAppDef(appId, appVersion);
      if (!delegateeSigner) {
        throw new Error(
          `No delegatee signer found for app ${appId}. App must be registered with a delegatee private key before it can be used.`,
        );
      }

      const server = getServer(vincentAppDef, delegateeSigner);
      await server.connect(transport);
    } else {
      // Invalid request
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
      return;
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: (error as Error).message || 'Internal Server Error',
      },
      id: null,
    });
  }
});

/**
 * Handles GET and DELETE requests for MCP sessions
 *
 * This function processes requests that require an existing session,
 * such as GET requests for streaming responses or DELETE requests to
 * terminate a session. It validates the session ID and delegates the
 * request handling to the appropriate transport.
 *
 * @param req - The Express request object
 * @param res - The Express response object
 * @internal
 */
const handleSessionRequest = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

app.get(MCP_URL, handleSessionRequest);
app.delete(MCP_URL, handleSessionRequest);

app.listen(HTTP_PORT, () => {
  console.log(`Centralized Vincent MCP Server listening on port ${HTTP_PORT}`);
});
