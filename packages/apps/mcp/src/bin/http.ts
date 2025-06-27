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
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import { LIT_EVM_CHAINS } from '@lit-protocol/constants';
import { VincentAppDefSchema } from '@lit-protocol/vincent-mcp-sdk';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import cors from 'cors';
import { ethers } from 'ethers';
import express, { Request, Response } from 'express';

import {
  authenticateWithSiwe,
  getSiweMessageToAuthenticate,
  authenticateWithJwt,
} from '../authentication';
import { env } from '../env';
import { getServer } from '../server';
import { transportManager } from '../transportManager';

const { PORT, VINCENT_APP_JSON_DEFINITION, VINCENT_DELEGATEE_PRIVATE_KEY } = env;

const YELLOWSTONE = LIT_EVM_CHAINS.yellowstone;

const vincentAppJson = fs.readFileSync(VINCENT_APP_JSON_DEFINITION, { encoding: 'utf8' });
const vincentAppDef = VincentAppDefSchema.parse(JSON.parse(vincentAppJson));

const delegateeSigner = new ethers.Wallet(
  VINCENT_DELEGATEE_PRIVATE_KEY,
  new ethers.providers.StaticJsonRpcProvider(YELLOWSTONE.rpcUrls[0]),
);

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../public')));

export interface ParsedSiweHeader {
  /**
   * The base64 encoded SIWE message.
   */
  b64message: string;
  /**
   * The hex encoded signature of the message.
   */
  signature: string;
}

/**
 * Parses a SIWE-V1 Authorization header.
 * * The expected format is: `Authorization: SIWE-V1 b64message="<base64_message>" signature="<hex_signature>"`
 *
 * @param header - The raw value from the `Authorization` HTTP header. Can be string, undefined, or null.
 * @returns If header is present, an object containing the message and signature.
 * @throws An error if the header is malformed or using an unsupported scheme.
 */
function parseSiweHeader(header: string | undefined | null): ParsedSiweHeader | undefined {
  if (!header) return;

  const [scheme, ...params] = header.split(' ');
  const paramsStr = params.join(' ');

  if (scheme !== 'SIWE-V1') {
    throw new Error(`Unsupported authentication scheme. Expected "SIWE-V1", got "${scheme}".`);
  }
  if (!paramsStr) {
    throw new Error('Authentication parameters are missing after the scheme.');
  }

  const regex = /b64message="([^"]*)"\s+signature="([^"]*)"/;
  const match = paramsStr.match(regex);
  if (!match) {
    throw new Error('Invalid parameters format. Expected \'b64message="..." signature="..."\'.');
  }

  // const fullMatchedString = match[0];
  const b64message = match[1];
  const signature = match[2];

  if (!b64message || !signature) {
    throw new Error('Message or signature parameter is empty.');
  }

  return { b64message, signature };
}

function returnWithError(res: Response, httpStatus: number, message: string): void {
  res.status(httpStatus).json({
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message,
    },
    id: null,
  });
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.get('/appDef', (req, res) => {
  res.sendFile(VINCENT_APP_JSON_DEFINITION);
});

app.get('/siwe', async (req: Request, res: Response) => {
  try {
    const { address } = req.query;
    if (!address || typeof address !== 'string') {
      res.status(422).json({ error: 'Address is a required query parameters.' });
      return;
    }

    res.status(200).send({ msgToSign: getSiweMessageToAuthenticate(address) });
  } catch (error) {
    console.error('Error generating message:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/mcp', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    // Get the corresponding transport (from sessionId or create a new one if asked)
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

      // Get all the possible authentications (Headers or Query params. Body is used for json rpc methods)
      let jwt = req.query.jwt as string;
      let signature = req.query.signature as string;
      let message = req.query.b64message
        ? Buffer.from(req.query.b64message as string, 'base64').toString()
        : undefined;
      const [authenticationHeaderScheme, authenticationHeader] = (
        req.headers['authorization'] || ''
      ).split(' ');
      switch (authenticationHeaderScheme) {
        case 'Bearer': // Using JWT
          jwt = authenticationHeader;
          break;
        case 'SIWE-V1': {
          const parsedSiweMessage = parseSiweHeader(req.headers['authorization']);
          if (parsedSiweMessage) {
            signature = parsedSiweMessage.signature;
            message = Buffer.from(parsedSiweMessage.b64message, 'base64').toString();
          }
          break;
        }
      }

      const usingJwt = !!jwt;
      const usingSiwe = !!message || !!signature; // Just using one is considered using it

      // Using both or none are incorrect
      if (usingSiwe && usingJwt) {
        return returnWithError(
          res,
          401,
          'Authentication failed. Found both JWT and SIWE values. Choose one',
        );
      } else if (!usingSiwe && !usingJwt) {
        return returnWithError(
          res,
          401,
          'Authentication failed. Could not find JWT nor SIWE values. Choose one',
        );
      }

      // Only one authentication. Good. Authenticate the user now
      let authenticatedAddress;
      try {
        // Do not separate these two. The corresponding one MUST run. If nothing runs and authenticatedAddress goes through empty user will have delegatee priviledge
        authenticatedAddress = usingSiwe
          ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            await authenticateWithSiwe(message!, signature!)
          : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            authenticateWithJwt(jwt!, vincentAppDef.id, vincentAppDef.version);
      } catch (e) {
        console.error(`Client authentication failed: ${(e as Error).message}`);
        return returnWithError(
          res,
          401,
          `Authentication failed. Check passed ${usingSiwe ? 'SIWE message and signature' : 'jwt'}`,
        );
      }

      // Create the MCP server and connect its transport
      try {
        const delegatorPkpEthAddress =
          authenticatedAddress !== delegateeSigner.address ? authenticatedAddress : undefined;

        const server = await getServer(vincentAppDef, {
          delegateeSigner,
          delegatorPkpEthAddress,
        });
        await server.connect(transport);
      } catch (e) {
        console.error(`Client authentication failed: ${(e as Error).message}`);
        return returnWithError(res, 500, 'Could not generate MCP Server');
      }
    } else {
      // Invalid request
      return returnWithError(res, 400, 'Bad Request: No valid session ID provided');
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    return returnWithError(res, 500, 'Internal Server Error');
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
    return returnWithError(res, 400, 'Invalid or missing session ID');
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const transport = transportManager.getTransport(sessionId)!;
  await transport.handleRequest(req, res);
};
app.get('/mcp', handleSessionRequest);

// Clients are not allowed to delete their transport/session. Some never destroy it (Anthropic) and some try to use it after calling DELETE (OpenAI)
// We take their ownership in transportManager
app.delete('/mcp', async (req: Request, res: Response) => {
  return returnWithError(res, 405, 'Method not allowed');
});

app.listen(PORT, () => {
  console.log(`MCP Stateless Streamable HTTP Server listening on port ${PORT}`);
});
