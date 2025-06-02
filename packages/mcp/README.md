# Vincent MCP Server

This package contains a Vincent App Server that can be used to serve Vincent Apps over the MCP protocol.

It leverages the `mcp` utils in `@lit-protocol/vincent-sdk` to build a server from a Vincent App definition and then exposing it over the STDIO or HTTP transport.

## Setup

- Copy `vincent-app.example.json` to `vincent-app.json` or any other name you want and configure your Vincent App definition in it.
- Copy `.env.example` to `.env` and fill in the values. Use absolute paths for the `VINCENT_APP_JSON_DEFINITION` value.

# Running

The recommended way to run the Vincent MCP server is using the npx commands below.

But if you want to run it locally, you can build the package and run the server directly. Or run locally in development mode which will enable hot reloading, source code updates, etc.

## Using NPX Commands

You can run the Vincent MCP server directly using npx without downloading the repository:

### STDIO mode
```bash
npx @lit-protocol/vincent-mcp stdio
```

When setting this in the LLM client, pass it the necessary environment variables from your client.

### HTTP mode
```bash
npx @lit-protocol/vincent-mcp http
```

In HTTP mode, the environment variables are configured on the server itself, not the client.

These commands require the following environment variables to be set:
- `VINCENT_APP_JSON_DEFINITION`: Path to your Vincent App definition JSON file
- `PUBKEY_ROUTER_DATIL_CONTRACT`: The public key router Datil contract address
- `VINCENT_DELEGATEE_PRIVATE_KEY`: The private key of the delegatee. This is the one you added in the Vincent App Dashboard as [an authorized signer for your app](https://docs.heyvincent.ai/documents/Quick_Start.html#:~:text=New%20App%22%20button.-,Delegatees,-%3A%20Delegatees%20are).
- `VINCENT_DATIL_CONTRACT`: The Vincent Datil contract address
- `HTTP_PORT` (for HTTP mode only): The port to run the HTTP server on (defaults to 3000)

You can set these environment variables in your shell before running the commands, or use a tool like `dotenv-cli`:
```bash
npx dotenv-cli -e /path/to/.env -- npx @lit-protocol/vincent-mcp http
```

## Local Running

### STDIO mode

- Build the package: `pnpm build`
- Add a config in your LLM client MCP config file to run the following command to run the server: `node /<ABSOLUTE_PATH_TO_VINCENT_MCP>/bin/stdio.js`.
- Add the environment variables in your LLM client config.
- Run your LLM Client and trigger it to connect to the Vincent MCP server.

### HTTP mode

- Build the package: `pnpm build`
- Run `node /<ABSOLUTE_PATH_TO_VINCENT_MCP>/bin/http.js`. Remember to set the environment variables before running the command.
- The server will be available at `http://localhost:3000/mcp` (or the port you specified in the `.env` file)
- Connect your LLM client to `http://localhost:3000/mcp` to connect to the server.

# Development

## STDIO mode

When integrating with LLM tools or frameworks, you can configure the Vincent MCP server to run `typescript` directly with `tsx`. Here's an example configuration:

```json
{
    "mcpServers": {
        "uniswapSwap": {
          "command": "npx",
          "args": [
            "-y",
            "tsx",
            "--env-file=/<ABSOLUTE_PATH_TO_VINCENT_MCP>/vincent-mcp/.env",
            "/<ABSOLUTE_PATH_TO_VINCENT_MCP>/vincent/packages/mcp/src/stdio.ts"
          ]
        }
    }
}
```

This configuration launches the Vincent MCP server in STDIO mode using the `tsx` runtime with a specified environment file. You have to adjust the paths to match your local development environment.

## HTTP mode

- Run `pnpm dev:http` to start the server in HTTP mode.
- The server will be available at `http://localhost:3000/mcp` (or the port you specified in the `.env` file)
- Connect your LLM client to `http://localhost:3000/mcp` to connect to the server.

# Integrations

Check our [Vincent Docs page](https://docs.heyvincent.ai/) to see how to integrate this MCP server with other services such as OpenAI or Anthropic responses APIs or multiple AgentKits

