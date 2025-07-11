# Vincent MCP SDK

## Installation

```
npm install @lit-protocol/vincent-mcp-sdk
```

# Model Context Protocol (MCP) Integration

## Overview

The Vincent MCP SDK provides integration with the Model Context Protocol (MCP), allowing developers to transform their Vincent applications into MCP servers. This enables Large Language Models (LLMs) to interact with and operate Vincent tools on behalf of delegators.

MCP provides a standardized way for LLMs to discover and use tools, making it easier to build AI-powered applications that can leverage Vincent's capabilities.

## Usage

The SDK provides tools to transform your Vincent application into an MCP server, exposing your tools to LLMs:

```typescript
import { ethers } from 'ethers';
import { getVincentAppServer, VincentAppDef } from '@lit-protocol/vincent-mcp-sdk';
import { bundledVincentTool as firstBundledVincentTool } from '@organization/first-tool-npm-pkg-name';
import { bundledVincentTool as secondBundledVincentTool } from '@organization/second-tool-npm-pkg-name';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Create a signer for your delegatee account
const provider = new ethers.providers.JsonRpcProvider(
  'https://mainnet.infura.io/v3/YOUR_INFURA_KEY'
);
const delegateeSigner = new ethers.Wallet('YOUR_DELEGATEE_PRIVATE_KEY', provider);

// Define your Vincent application with tools
const vincentApp: VincentAppDef = {
  id: '8462368',
  name: 'My Vincent App',
  version: '1',
  tools: {
    '@organization/first-tool-npm-pkg-name': {
      version: '0.1.0',
      bundledVincentTool: firstBundledVincentTool,
      name: 'sendMessage',
      description: 'Send a message to a user',
      parameters: {
        recipient: {
          description: 'Ethereum address of the recipient',
        },
        message: {
          description: 'Message content to send',
        },
      },
    },
    '@organization/second-tool-npm-pkg-name': {
      version: '0.1.0',
      bundledVincentTool: secondBundledVincentTool,
      name: 'checkBalance',
      description: 'Check the balance of an account',
      parameters: {
        address: {
          description: 'Ethereum address to check',
        },
      },
    },
  },
};

// Create an MCP server from your Vincent application
const mcpServer = await getVincentAppServer(delegateeSigner, vincentApp);

// Connect the server to a transport (e.g., stdio for CLI-based LLM tools)
const stdioTransport = new StdioServerTransport();
await mcpServer.connect(stdioTransport);
// For HTTP-based integration, you can use HTTP transport instead
```

### How It Works

1. **Install Tool packages from NPM**: Install tool packages from NPM using the package names and versions specified in your Vincent application definition.

2. **Define Your Vincent Application**: Create a Vincent application definition with the tools you want to expose to LLMs.

3. **Create an MCP Server**: Use `getVincentAppServer()` to transform your Vincent application definition into an MCP server.

4. **Connect to a Transport**: Connect your MCP server to a transport mechanism (stdio, HTTP, etc.) to allow LLMs to communicate with it.

5. **LLM Interaction**: LLMs can now discover and use your Vincent tools through the MCP interface, executing them on behalf of authenticated users.

### Benefits

- **Standardized Interface**: MCP provides a standardized way for LLMs to discover and use your Vincent tools.
- **Delegated Execution**: LLMs can execute Vincent tools on behalf of your app delegator users.
- **Flexible Integration**: Support for various transport mechanisms allows integration with different LLM platforms and environments.
- **Extendability**: MCP server can be extended with custom tools and prompts to suit your specific needs.

## Release

Pre-requisites:

- You will need a valid npm account with access to the `@lit-protocol` organization.

Then run `pnpm release` on the repository root. It will prompt you to update the Vincent MCP SDK version and then ask you to confirm the release.
This process will also generate a `CHANGELOG.md` record with the changes for the release.
