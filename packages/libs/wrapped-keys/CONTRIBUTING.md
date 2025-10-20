# Contributing to Vincent Wrapped Keys SDK

This document provides guidelines for contributing to the Vincent Wrapped Keys SDK project.

## Overview

The Vincent Wrapped Keys SDK exposes utilities and Lit Actions for managing Wrapped Keys for the Vincent ecosystem.

## Setup

Follow the global setup instructions in the repository root [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## Development Workflow

### Building

Build the SDK:

```bash
nx build wrapped-keys
```

## Project Structure

- `src/`: Source code
  - `lib/`: Core library code
    - `api/`: public API functions for calling the wrapped keys service
    - `constants.ts`: Shared constants
    - `lit-actions/`: Lit Actions for wrapped keys operations
    - `lit-actions-client/`: Client for interacting with Lit Actions
    - `service-client/`: wrapped keys service client for executing delegated lambdas
    - `types.ts`: TypeScript type definitions

## SDK Development Guidelines

1. Maintain strong TypeScript typing throughout the codebase
2. Use Zod for schema validation
3. Design APIs that are intuitive and easy to use
4. Provide comprehensive documentation for all public APIs
5. Write unit tests for all functionality
6. Ensure backward compatibility when making changes

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

1. **Primary Context**: When working within the wrapped-keys project directory, AI editors should prioritize this CONTRIBUTING.md file and the project's README.md for specific guidance on the Wrapped Keys SDK.

2. **Secondary Context**: The root-level CONTRIBUTING.md and README.md files provide important context about how this SDK fits into the broader Vincent ecosystem.

### Related Projects

The Wrapped Keys SDK is a core component that is used by:

- `ability-sol-transaction-signer`: For implementing Solana transaction signing abilities

When working on Wrapped Keys SDK code, consider these consumers for context, and focus on maintaining backward compatibility and strong type safety.

## Additional Resources

- [Vincent Documentation](https://docs.heyvincent.ai/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Zod Documentation](https://zod.dev/)
- [Lit Protocol Wrapped Keys Documentation](https://developer.litprotocol.com/user-wallets/wrapped-keys/overview)
