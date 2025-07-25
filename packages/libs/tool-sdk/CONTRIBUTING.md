# Contributing to Vincent Tool SDK

This document provides guidelines for contributing to the Vincent Tool SDK project.

## Overview

The Vincent Tool SDK is an SDK exposing utilities to develop Vincent tools and policies. It provides a type-safe lifecycle system for defining and composing policies and tools, with strong TypeScript inference support throughout.

## Setup

1. Follow the global setup instructions in the repository root [CONTRIBUTING.md](../../../CONTRIBUTING.md).
2. Install dependencies:
   ```bash
   pnpm install
   ```

## Development Workflow

### Building

Build the SDK:

```bash
nx build tool-sdk
```

### Type Checking

Run type checking:

```bash
pnpm typecheck
```

### Watch Mode for Type Checking

Run type checking in watch mode:

```bash
pnpm watch:type-tests
```

## Project Structure

- `src/`: Source code
  - `lib/`
  - `type-inference-verification/`

## SDK Development Guidelines

1. Maintain strong TypeScript typing throughout the codebase
2. Use Zod for schema validation
3. Design APIs that are intuitive and easy to use
4. Provide comprehensive documentation for all public APIs
5. Write unit tests for all functionality
6. Ensure backward compatibility when making changes

## Core Concepts

The SDK is built around these core concepts:

- **Policies**: Encapsulate decision logic (precheck, evaluate, commit) and define their input/output schemas.
- **Tools**: Orchestrate multiple policies and expose `precheck` and `execute` lifecycle methods.

## Testing

Write unit tests for all functionality:

```bash
pnpm test
```

## Documentation

- Document all public APIs with JSDoc comments
- Update README.md when adding new features
- Provide examples for common use cases

## Pull Request Process

1. Ensure your code follows the coding standards
2. Update documentation if necessary
3. Include tests for new functionality
4. Link any related issues in your pull request description
5. Request a review from a maintainer

## For AI Editors and IDEs

When working with AI-powered editors like Cursor, GitHub Copilot, or other AI assistants in this project directory, please note:

### Context Priority

1. **Primary Context**: When working within the tool-sdk project directory, AI editors should prioritize this CONTRIBUTING.md file and the project's README.md for specific guidance on the Tool SDK.

2. **Secondary Context**: The root-level CONTRIBUTING.md and README.md files provide important context about how this SDK fits into the broader Vincent ecosystem.

### Key Files for Tool SDK Context

- `/packages/libs/tool-sdk/README.md`: Overview of the Tool SDK project
- `/packages/libs/tool-sdk/CONTRIBUTING.md`: This file, with Tool SDK-specific contribution guidelines
- `/packages/libs/tool-sdk/src/`: Source code for the Tool SDK

### Related Projects

The Tool SDK is a core component that is used by:

- `policy-spending-limit`: For implementing spending limit policies
- `tool-erc20-approval`: For implementing ERC20 approval tools
- `tool-uniswap-swap`: For implementing Uniswap swap tools
- `tool-morpho`: For implementing Morpho tools

When working on Tool SDK code, consider these consumers for context, and focus on maintaining backward compatibility and strong type safety.

## Additional Resources

- [Vincent Documentation](https://docs.heyvincent.ai/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Zod Documentation](https://zod.dev/)
