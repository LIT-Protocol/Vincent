# Contributing to Vincent MCP SDK

This document provides guidelines for contributing to the Vincent MCP SDK project.

## Overview

The Vincent MCP SDK is a TypeScript SDK that exposes useful tools to transform a Vincent App into a Model Context Protocol (MCP) Server.

## Setup

Follow the global setup instructions in the repository root [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## Project Structure

- `src/`: Source code
  - `index.ts`: Main entry point
  - `definitions.ts`: Zod schemas and its derived types that define a Vincent App or Tool properties needed for MCP
  - `server.ts`: Utility functions to transform from a Vincent App definition to an MCP server

## SDK Components

### MCP Transformation

This SDK provides tools to transform your Vincent application into an MCP server, exposing your tools to LLMs or AI Agents.

## Coding Standards

1. Use TypeScript for all new code
2. Follow the project's existing coding style
3. Write clear, descriptive comments and JSDoc for public APIs
4. Include appropriate error handling
5. Write unit tests for new functionality
6. Maintain backward compatibility when possible

## Type Safety

- Use proper TypeScript types for all functions and variables
- Avoid using `any` type; prefer `unknown` when the type is truly unknown
- Use generics where appropriate to maintain type safety
- Ensure exported APIs have proper type definitions

## Testing

Write unit tests for new functionality:

```bash
pnpm test
```

## Documentation

- Document all public APIs with JSDoc comments
- Update README.md when adding new features
- Generate and review TypeDoc documentation

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

1. **Primary Context**: When working within the SDK project directory, AI editors should prioritize this CONTRIBUTING.md file and the project's README.md for specific guidance on the SDK project.

2. **Secondary Context**: The root-level CONTRIBUTING.md and README.md files provide important context about how this project fits into the broader Vincent ecosystem.

### Key Files for SDK Context

- `/packages/libs/mcp-sdk/README.md`: Overview of the MCP SDK project
- `/packages/libs/mcp-sdk/CONTRIBUTING.md`: This file, with MCP SDK-specific contribution guidelines
- `/packages/libs/mcp-sdk/src/`: Source code for the MCP SDK

### Related Projects

The MCP SDK is a related to the following Vincent projects:

- `app-sdk`: Vincent App SDK utility functions
- `tool-sdk`: Vincent Tool management and execution functions
- `mcp`: Vincent MCP Server runner

When working on MCP SDK code, consider these dependencies and consumers for context.

## Additional Resources

- [Vincent Documentation](https://docs.heyvincent.ai/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
