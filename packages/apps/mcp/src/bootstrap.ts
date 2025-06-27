/**
 * MCP Server Bootstrap for STDIO Transport
 *
 * This file is essential when using the stdio transport mechanism in the MCP server.
 * It solves a critical problem: separating JSON-RPC communication from logs/debug output.
 *
 * When using stdio as a transport layer for JSON-RPC:
 * - The parent process communicates with this process via stdin/stdout
 * - Without this bootstrap, logs and actual RPC messages would mix in stdout,
 *   making it impossible for the parent process to parse the RPC responses
 *
 * What this file does:
 * 1. Redirects all console output to stderr instead of stdout
 * 2. Intercepts all stdout.write calls
 * 3. Analyzes the content being written to determine if it's a JSON-RPC message
 * 4. Only allows actual JSON-RPC messages to go to stdout
 * 5. Redirects all other output (logs, debug info) to stderr
 *
 * This separation ensures clean communication between processes while maintaining
 * the ability to log information for debugging purposes.
 */

import { Console } from 'node:console';
const sink = new Console({ stdout: process.stderr, stderr: process.stderr });

global.console = sink as unknown as Console;

const origWrite = process.stdout.write.bind(process.stdout);

function isRpc(chunk: Buffer | string): boolean {
  const s = (typeof chunk === 'string' ? chunk : chunk.toString('utf8')).trim();
  if (!s.startsWith('{')) return false;

  try {
    const obj = JSON.parse(s);
    return obj?.jsonrpc === '2.0';
  } catch {
    return false;
  }
}

// @ts-expect-error complains about overloading without encoding
process.stdout.write = (
  chunk: any,
  encoding?: BufferEncoding,
  cb?: (err?: Error | null) => void,
) => {
  if (isRpc(chunk)) {
    // legitimate traffic – keep it on stdout
    return origWrite(chunk, encoding, cb);
  }

  // everything else goes to the sink instead
  process.stderr.write(chunk, encoding, cb);
  return true;
};
