# Vincent MCP Server

This package contains a Vincent App Server that can be used to serve Vincent Apps over the MCP protocol.

It leverages the `@lit-protocol/vincent-mcp-sdk` to build a server from a Vincent App definition and then exposing it over the STDIO or HTTP transport.

## Setup

- Optional: Copy `vincent-app.example.json` to `vincent-app.json` or any other name you want and configure your Vincent App definition overrides in it. If no overrides are needed, then this file can be omitted.
- Optional: Copy `.env.example` to `.env` and fill in the values. Use absolute paths for the `VINCENT_APP_JSON_DEFINITION` value. You can also pass them via CLI arguments when calling the script.

# Writing App definition overrides in a JSON file

Name and descriptions provided by developers in the registry might not be very descriptive to LLMs or you may want to modify them.

In order to override any of those values, create a `.json` file with the following structure:

```json
{
  "id": "8462368", // The Id of the Vincent App
  "version": "1", // The version of the Vincent App
  "name": "My Vincent App", // Name of the Vincent App. Can be overriden, doesn't have to be the same as in the registry.
  "description": "A Vincent application that executes tools for its delegators", // Description of the Vincent App. Can be overriden, doesn't have to be the same as in the registry.
  // Adding a tools object will override what is already present in the registry. Without this field, all tools from the registry will be exposed.
  "tools": {
    // Any tool that you want to expose to the LLM has to be included using its NPM package name as key in this object. If a tool is not included, it is not exposed as an MCP Server tool.
    "vincent-tool-npm-pkg-name": {
      "name": "myTool", // Name of the tool. Defaults to npm pkg name.
      "description": "A tool that does something", // Description of the tool.
      "parameters": {
        // Keys are the names of each param. Used to identify and apply the rest of properties.
        "param1": {
          "description": "A parameter that is used in the tool to do something" // Description of the param.
        }
        // ...rest of params you want to override.
      }
    },
    "vincent-tool-without-overrides": {} // Empty objects mean that the tool is exposed but with default values.
  }
}
```

When the `tools` property is omitted, all tools from the registry will be exposed. When overriding at least one tool, you need to specify all others that you want to still expose as MCP tools, even with empty values inside.

For any value that can be overriden, consider that those are the hints the LLM uses to know how to use the tool. Therefore, those are good places to provide any information you want the LLM to know about the tool such as units, formats, examples or pre-conditions to check.

Tools included in definition MUST be published in NPM and imported using their package names. Also, they must be part of the Vincent App and recorded in the Vincent Registry. Any tool that is not part of that specific app will fail its invocation.

# Running

The recommended way to run the Vincent MCP server is using the `npx` commands below.

But if you want to build and run it locally, you can clone the repository and run the server any way you want. Or run locally in development mode which will enable hot reloading, source code updates, etc.

## Using NPX Commands

You can run the Vincent MCP server directly using npx without downloading the repository:

### STDIO mode

```bash
npx @lit-protocol/vincent-mcp-server stdio
```

When setting this in the LLM client, pass it the necessary environment variables from your LLM client. These env variables include:

- `VINCENT_DELEGATEE_PRIVATE_KEY`: The private key of the delegatee. This is the one you added in the Vincent App Dashboard as [an authorized signer for your app](https://docs.heyvincent.ai/documents/Quick_Start.html#:~:text=New%20App%22%20button.-,Delegatees,-%3A%20Delegatees%20are). This private key MUST be an allowed delegatee of the Vincent App.
- (Optional) `VINCENT_APP_ID`: The Vincent App Id you want to run as an MCP Server
- (Optional) `VINCENT_APP_VERSION`: The Vincent App Version you want to run as an MCP Server
- (Optional) `VINCENT_APP_JSON_DEFINITION`: Path to your Vincent App overrides JSON file

Note: The environment MUST include the Vincent App Id, either via the `VINCENT_APP_ID` env variable or in the App definition JSON file. The version is completely optional as it will default to the latest version specified in the registry.

### HTTP mode

```bash
npx @lit-protocol/vincent-mcp-server http
```

In HTTP mode, the environment variables are configured on the server itself, not the client running it.

To configure runtime environment in this mode, set the following environment variables:

- `VINCENT_DELEGATEE_PRIVATE_KEY`: The private key of the delegatee. This is the one you added in the Vincent App Dashboard as [an authorized signer for your app](https://docs.heyvincent.ai/documents/Quick_Start.html#:~:text=New%20App%22%20button.-,Delegatees,-%3A%20Delegatees%20are). This private key MUST be an allowed delegatee of the Vincent App.
- (Optional) `VINCENT_APP_ID`: The Vincent App Id you want to run as an MCP Server
- (Optional) `VINCENT_APP_VERSION`: The Vincent App Version you want to run as an MCP Server
- (Optional) `VINCENT_APP_JSON_DEFINITION`: Path to your Vincent App overrides JSON file
- `EXPECTED_AUDIENCE`: The audience that you expect JWTs to have. Vincent populates this with the redirect URLs. Likely you want this server to be one of those URLs.
- `VINCENT_MCP_BASE_URL`: This MCP server URL. Used to generate SIWE messages and verify signatures
- `VINCENT_REGISTRY_URL`: This Vincent Registry server URL. Will be queried to get the Vincent App and its tools info
- (Optional) `PORT`: The port to run the HTTP server on (defaults to 3000)
- (Optional) `HTTP_TRANSPORT_CLEAN_INTERVAL`: Defines the interval (milliseconds) that the server will use to clean unused transports. Defaults to 1 hour
- (Optional) `HTTP_TRANSPORT_TTL`: Defines the time (milliseconds) that a transport will still be considered in use after the last time it was actually used. Defaults to 1 hour
- (Optional) `SIWE_EXPIRATION_TIME`: Duration of the generated SIWE message to sign. Defaults to 1 hour
- (Optional) `SIWE_NONCE_CLEAN_INTERVAL`: Defines the interval (milliseconds) that the server will use to clean unused transports. Defaults to 1 hour
- (Optional) `SIWE_NONCE_TTL`: Defines the time (milliseconds) that a SIWE nonce will still be considered valid after it was created. Defaults to 5 minutes

Note: The environment MUST include the Vincent App Id, either via the `VINCENT_APP_ID` env variable or in the App definition JSON file. The version is completely optional as it will default to the latest version specified in the registry.

Consider that a SIWE message must have a valid nonce, so it will become invalid after reaching the expiration time or the nonce has been discarded.

You can set these environment variables in your shell before running the commands, or use a tool like `dotenvx`:

```bash
dotenvx run -f /path/to/.env -- npx -y @lit-protocol/vincent-mcp-server http
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

# Platforms deployments

The [Uniswap Swap Demo](./vincent-app.example.json) has a fully working deployment of this Vincent MCP server.

## Heroku

[Heroku deployment](https://dashboard.heroku.com/apps/uniswap-swap-mcp) is running under the https://mcp-demo.heyvincent.ai/ domain. So you can find the JWT collector website there and connect to the MCP using `POST /mcp`.

### Updating

Follow Heroku instructions to add project remote repository in your local git repository. Then, at its root, run:

```bash
git push heroku $(git subtree split --prefix packages/apps/mcp HEAD):main --force
```

To deploy the latest changes of current branch to Heroku. Those will be pulled from GitHub, so ensure your changes are pushed there first.

## Render

[Render](https://dashboard.render.com/web/srv-d1hadg2li9vc73bhu05g) is also hosting this MCP server, under domain https://uniswap-swap-mcp.onrender.com

### Updating

In this hosting the updates are triggered directly from GitHub. Any updates on the configured branch will automatically update the deployed server.

# Integrations

Check our [Vincent Docs page](https://docs.heyvincent.ai/) to see how to integrate this MCP server with other services such as OpenAI or Anthropic responses APIs or multiple AgentKits
