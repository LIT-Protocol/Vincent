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

import { mcp } from '@lit-protocol/vincent-sdk';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import express, { Request, Response } from 'express';

import { env } from './env';
import { getServer } from './server';

const { HTTP_PORT, VINCENT_APP_JSON_DEFINITION } = env;
const { VincentAppDefSchema } = mcp;

const vincentAppJson = fs.readFileSync(VINCENT_APP_JSON_DEFINITION, { encoding: 'utf8' });
const vincentAppDef = VincentAppDefSchema.parse(JSON.parse(vincentAppJson));

const app = express();
app.use(express.json());

// In-memory store for transports
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

app.post('/mcp', async (req: Request, res: Response) => {
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

      const server = getServer(vincentAppDef);
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
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

app.get('/mcp', handleSessionRequest);
app.delete('/mcp', handleSessionRequest);

app.listen(HTTP_PORT, () => {
  console.log(`MCP Stateless Streamable HTTP Server listening on port ${HTTP_PORT}`);
});
