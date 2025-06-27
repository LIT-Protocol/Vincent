# Vincent MCP Server

This package contains a Vincent App Server that can be used to serve Vincent Apps over the MCP protocol.

It leverages the `@lit-protocol/vincent-mcp-sdk` to build a server from a Vincent App definition and then exposing it over the STDIO or HTTP transport.

## Setup

- Copy `vincent-app.example.json` to `vincent-app.json` or any other name you want and configure your Vincent App definition in it.
- Copy `.env.example` to `.env` and fill in the values. Use absolute paths for the `VINCENT_APP_JSON_DEFINITION` value.

# Writing App definition JSON file

To define the Vincent App that will be transformed into an MCP Server, a JSON definition of it must be provided.

```json
{
  "id": "8462368", // The Id of the Vincent App
  "version": "1", // The version of the Vincent App
  "name": "My Vincent App", // Name of the Vincent App. Can be overriden, doesn't have to be the same as in the registry.
  "description": "A Vincent application that executes tools for its delegators", // Description of the Vincent App. Can be overriden, doesn't have to be the same as in the registry.
  "tools": {
    // Any tool that you want to expose to the LLM has to be included using its IPFS CID as key in this object. If a tool is not included, it is not exposed as an MCP Server tool.
    "QmIpfsCid1": {
      "name": "myTool", // Name of the tool. Can be overriden, doesn't have to be the same as in the registry.
      "description": "A tool that does something", // Description of the tool. Can be overriden, doesn't have to be the same as in the registry.
      // All parameters of the tool have to be added under this array or the LLM won't be able to see them or provide values for it
      "parameters": [
        {
          "name": "param1", // Name of the param. Cannot be overriden.
          "type": "string", // Type of the param. Must be the type the tool expects.
          "description": "A parameter that is used in the tool to do something" // Description of the param. Can be overriden.
        }
        // ...rest of params you want to expose.
        // Any optional param that is not included here will be exposed by the tool.
      ]
    }
  }
}
```

For any value that can be overriden, consider that those are the hints the LLM uses to know how to use the tool. Therefore, those are good places to provide any information you want the LLM to know about the tool such as units, formats, examples or pre-conditions to check.

If you are the owner of the app, most of the data can be obtained from the Vincent App page in the Vincent dashboard.

If you are not the owner of the app, the tool fields and its included tools IPFS CIDs are shown in the consent screen.

The IPFS CID can also be obtained from the bundled tool code published in npm. For example [vincent-tool-metadata.json](../tool-erc20-approval/src/generated/vincent-tool-metadata.json) for our ERC20 approval tool.
To get the tool params from source code, you can check the tool schemas such as [schemas.ts](../tool-erc20-approval/src/lib/schemas.ts) for our ERC20 approval tool.

Any tool created using our [Tools and Policies SDK](https://www.npmjs.com/package/@lit-protocol/vincent-tool-sdk) will provide those files.

# Running

The recommended way to run the Vincent MCP server is using the `npx` commands below.

But if you want to build and run it locally, you can clone the repository and run the server any way you want. Or run locally in development mode which will enable hot reloading, source code updates, etc.

## Using NPX Commands

You can run the Vincent MCP server directly using npx without downloading the repository:

### STDIO mode

```bash
npx @lit-protocol/vincent-mcp-server stdio
```

When setting this in the LLM client, pass it the necessary environment variables from your client. These env variables include:

- `VINCENT_APP_JSON_DEFINITION`: Path to your Vincent App definition JSON file
- `VINCENT_DELEGATEE_PRIVATE_KEY`: The private key of the delegatee. This is the one you added in the Vincent App Dashboard as [an authorized signer for your app](https://docs.heyvincent.ai/documents/Quick_Start.html#:~:text=New%20App%22%20button.-,Delegatees,-%3A%20Delegatees%20are). This private key MUST be an allowed delegatee of the Vincent App defined in the JSON.

### HTTP mode

```bash
npx @lit-protocol/vincent-mcp-server http
```

In HTTP mode, the environment variables are configured on the server itself, not the client running it.

These commands require the following environment variables to be set:

- `EXPECTED_AUDIENCE`: The audience that you expect JWTs to have. Vincent populates this with the redirect URLs. Likely you want this server to be one of those URLs.
- `VINCENT_APP_JSON_DEFINITION`: Path to your Vincent App definition JSON file
- `VINCENT_DELEGATEE_PRIVATE_KEY`: The private key of the delegatee. This is the one you added in the Vincent App Dashboard as [an authorized signer for your app](https://docs.heyvincent.ai/documents/Quick_Start.html#:~:text=New%20App%22%20button.-,Delegatees,-%3A%20Delegatees%20are).
- `VINCENT_MCP_BASE_URL`: This MCP server URL
- `PORT` (for HTTP mode only): The port to run the HTTP server on (defaults to 3000)

Other optional environment variables include:

- `HTTP_TRANSPORT_CLEAN_INTERVAL`: Defines the interval (milliseconds) that the server will use to clean unused transports. Defaults to 1 hour
- `HTTP_TRANSPORT_TTL`: Defines the time (milliseconds) that a transport will still be considered in use after the last time it was actually used. Defaults to 1 hour
- `SIWE_EXPIRATION_TIME`: Duration of the generated SIWE message to sign. Defaults to 1 hour
- `SIWE_NONCE_CLEAN_INTERVAL`: Defines the interval (milliseconds) that the server will use to clean unused transports. Defaults to 1 hour
- `SIWE_NONCE_TTL`: Defines the time (milliseconds) that a SIWE nonce will still be considered valid after it was created. Defaults to 5 minutes

Consider that a SIWE message must have a valid nonce, so it will become unvalid after reaching the expiration time or the nonce has been discarded.

You can set these environment variables in your shell before running the commands, or use a tool like `dotenvx`:

```bash
dotenvx run -f /path/to/.env -- npx @lit-protocol/vincent-mcp-server http
```

For an .env file example check [./.env.example](./.env.example)

## Local Running

### STDIO mode

- Build the package: `pnpm build`
- Add a config in your LLM client MCP config file to run the following command to run the server: `node /<ABSOLUTE_PATH_TO_VINCENT_MCP>/bin/stdio.js`.
- Add the environment variables in your LLM client config.
- Run your LLM Client and trigger the STDIO server to connect to the Vincent MCP server.

### HTTP mode

- Build the package: `pnpm build`
- Run `node /<ABSOLUTE_PATH_TO_VINCENT_MCP>/bin/http.js`. Remember to set the environment variables before running the command.
- The server will be available at `http://localhost:3000/mcp` (or the port you specified in the `PORT` environment variable)
- Connect your LLM client to `http://localhost:3000/mcp` to connect to the server.

### Authentication

STDIO mode does not require any authentication. The server requires a Vincent App delegatee private key, therefore, the only user capable of running the server is one of the delegatees.

HTTP mode requires one of two forms of authentication:

- A SIWE message signed by the delegatee
  1. Request a SIWE message with `GET /siwe`
  2. Sign it with the delegatee private key or the delegator agent PKP
  3. Request an MCP server session at `POST /mcp` passing the `authorization` header with the following content `SIWE-V1 b64message="<base64_encoded_message>" signature="<hex_signature>"`
  - If your LLM client does not support passing the `authorization` header, you can still pass the delegator jwt in the `jwt` query param of the SIWE message and its signature in `b64message` and `signature` query params. However, using `authentication` header is preferred as query params might be logged or used for caching or tracing purposes.
- A delegator JWT in `authorization` header.
  - JWT can be obtained from the Vincent App consent screen.
  - This server displays a JWT collection website at its base URL (`GET /`). You can add the server URL as a redirect URL in your Vincent App to give customers the complete link they can use in any LLM client with support for HTTP MCPs

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
        "/<ABSOLUTE_PATH_TO_VINCENT_MCP>/vincent/packages/apps/mcp/src/stdio.ts"
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
