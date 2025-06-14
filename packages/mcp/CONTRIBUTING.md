# Contributing to Vincent MCP

This document provides guidelines for contributing to the Vincent MCP (Model Context Protocol) project.

## Overview

The Vincent MCP project provide servers that can be used to serve Vincent Apps over the MCP protocol. It leverages the `mcp` utils in `@lit-protocol/vincent-sdk` to build a server from a Vincent App definition and then exposes it over the STDIO or HTTP transport.

## Setup

1. Follow the global setup instructions in the repository root [CONTRIBUTING.md](../../CONTRIBUTING.md).
2. Copy `vincent-app.example.json` to `vincent-app.json` or any other name you want and configure your Vincent App definition in it.
3. Copy `.env.example` to `.env` and fill in the values. Use absolute paths for the `VINCENT_APP_JSON_DEFINITION` value.

## Development Workflow

### Local Development

1. Build the package:

   ```bash
   pnpm build
   ```

2. For development with hot reloading:

   ```bash
   # For STDIO mode
   pnpm dev:stdio

   # For HTTP mode
   pnpm dev:http
   ```

### Testing

Run the MCP inspector to test your MCP server:

```bash
pnpm inspector
```

Alternatively, you can use Postman or any other MCP debugger. LLM clients should be used after validating the MCP is working as expected due to the variability of Large Language Models.

## Running the Server

### STDIO Mode

- For development: `pnpm dev:stdio`
- For production: `node src/stdio.js` (ideally in build directory)
- From npm directly: `npx @lit-protocol/vincent-mcp stdio`

### HTTP Mode

- For development: `pnpm dev:http`
- For production: `node src/http.js` (ideally in build directory)
- From npm directly: `npx @lit-protocol/vincent-mcp http`

## Project Structure

- `src/`: Source code
  - `extensions.ts`: MCP Server extender to provide more than the tools in the Vincent App
  - `http.ts`: HTTP transport implementation
  - `server.ts`: MCP Server builder
  - `stdio.ts`: STDIO transport implementation
- `vincent-app.example.json`: Example Vincent App definition

## Coding Standards

1. Use TypeScript for all new code
2. Follow the project's existing coding style
3. Write clear, descriptive comments
4. Include appropriate error handling
5. Write unit tests for new functionality

## Pull Request Process

1. Ensure your code follows the coding standards
2. Update documentation if necessary
3. Include tests for new features or bug fixes
4. Link any related issues in your pull request description
5. Add an nx version plan documenting your changes
6. Request a review from a maintainer

## For AI Editors and IDEs

When working with AI-powered editors like Cursor, GitHub Copilot, or other AI assistants in this project directory, please note:

### Context Priority

1. **Primary Context**: When working within the MCP project directory, AI editors should prioritize this CONTRIBUTING.md file and the project's README.md for specific guidance on the MCP project.

2. **Secondary Context**: The root-level CONTRIBUTING.md and README.md files provide important context about how this project fits into the broader Vincent ecosystem.

### Key Files for MCP Context

- `/packages/mcp/README.md`: Overview of the MCP project
- `/packages/mcp/CONTRIBUTING.md`: This file, with MCP-specific contribution guidelines
- `/packages/mcp/src/`: Source code for the MCP server
- `/packages/mcp/vincent-app.example.json`: Example configuration

### Related Projects

The MCP project depends on:

- `@lit-protocol/vincent-sdk`: For MCP utilities and Vincent integration
- `@modelcontextprotocol/sdk`: For MCP protocol implementation

When working on MCP integration code, consider these dependencies for context.

## Additional Resources

- [Vincent Documentation](https://docs.heyvincent.ai/)
- [MCP Documentation](https://modelcontextprotocol.github.io/)
- [SDK Documentation](https://sdk-docs.heyvincent.ai/)
