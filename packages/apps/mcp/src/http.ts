#!/usr/bin/env node
/**
 * HTTP server implementation for Vincent MCP
 *
 * This module provides an HTTP server implementation for the Model Context Protocol (MCP)
 * using Express. It creates a streamable HTTP server that can handle MCP requests
 * and maintain session state across multiple requests.
 *
 * The server loads a Vincent application definition from a JSON file and creates
 * an MCP server with extended capabilities for that application. It then exposes
 * the server via HTTP endpoints that follow the MCP protocol.
 *
 * @module http
 * @category Vincent MCP
 */

import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

import { VincentAppDefSchema } from '@lit-protocol/vincent-mcp-sdk';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import express, { Request, Response } from 'express';

import { env } from './env';
import { getServer } from './server';
import { transportManager } from './transportManager';

const { HTTP_PORT, VINCENT_APP_JSON_DEFINITION } = env;

const vincentAppJson = fs.readFileSync(VINCENT_APP_JSON_DEFINITION, { encoding: 'utf8' });
const vincentAppDef = VincentAppDefSchema.parse(JSON.parse(vincentAppJson));

const app = express();
app.use(express.json());

app.post('/mcp', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transportManager.getTransport(sessionId)) {
      // Reuse existing transport
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      transport = transportManager.getTransport(sessionId)!;
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New initialization request
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId) => {
          transportManager.addTransport(sessionId, transport);
        },
      });

      const server = await getServer(vincentAppDef);
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
        message: 'Internal Server Error',
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
  if (!sessionId || !transportManager.getTransport(sessionId)) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const transport = transportManager.getTransport(sessionId)!;
  await transport.handleRequest(req, res);
};

app.get('/mcp', handleSessionRequest);

// Clients are not allowed to delete their transport/session. Some never destroy it (Anthropic) and some try to use it after calling DELETE (OpenAI)
app.delete('/mcp', async (req: Request, res: Response) => {
  console.log('Received DELETE MCP request');
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Method not allowed.',
      },
      id: null,
    }),
  );
});

app.listen(HTTP_PORT, () => {
  console.log(`MCP Stateless Streamable HTTP Server listening on port ${HTTP_PORT}`);
});
