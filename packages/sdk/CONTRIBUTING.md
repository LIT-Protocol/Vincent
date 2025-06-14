# Contributing to Vincent SDK

This document provides guidelines for contributing to the Vincent SDK project.

## Overview

The Vincent SDK is a TypeScript SDK that exposes useful tools to interact with Vincent systems in web or Node.js environments. It provides client libraries for both frontend applications and backend services, as well as utilities for integrating with the Model Context Protocol (MCP).

## Setup

1. Follow the global setup instructions in the repository root [CONTRIBUTING.md](../../CONTRIBUTING.md).
2. Install dependencies:
   ```bash
   pnpm install
   ```

## Development Workflow

### Building

Build the SDK:

```bash
pnpm build
```

### Documentation

Generate TypeDoc documentation:

```bash
pnpm typedoc
```

## Project Structure

- `src/`: Source code
  - `index.ts`: Main entry point
  - `app/`: Web utilities to authenticate against Vincent Apps in clients
  - `express-authentication-middleware/`: Express middleware wrapper to properly validate clients JWT server side
  - `jwt/`: Utility functions to work with Vincent JWT between Vincent Apps client and server
  - `mcp/`: Model Context Protocol transformer
  - `tool/`: Utility functions to work with Vincent Tools

## SDK Components

### VincentWebAppClient

The Vincent Web App Client provides methods for managing user authentication, JWT tokens, and consent flows in Vincent applications.

### VincentToolClient

The Vincent Tool Client uses an ethers signer for your delegatee account to run Vincent Tools on behalf of your app users.

### MCP Integration

This SDK provides tools to transform your Vincent application into an MCP server, exposing your tools to LLMs.

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

- `/packages/sdk/README.md`: Overview of the SDK project
- `/packages/sdk/CONTRIBUTING.md`: This file, with SDK-specific contribution guidelines
- `/packages/sdk/src/`: Source code for the SDK

### Related Projects

The SDK is a core component that is used by:

- `vincent-mcp`: For MCP server implementation
- `vincent-tools`: For tool and policy implementation
- `app-dashboard`: For frontend integration

When working on SDK code, consider these dependencies and consumers for context.

## Additional Resources

- [Vincent Documentation](https://docs.heyvincent.ai/)
- [SDK Documentation](https://sdk-docs.heyvincent.ai/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
