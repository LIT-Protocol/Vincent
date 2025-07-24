# Contributing to Vincent Tool Transaction Signer

This document provides guidelines for contributing to the Vincent Tool Transaction Signer project.

## Overview

The Vincent Tool Transaction Signer is a tool to sign transactions using a Vincent Agent Wallet. It's part of the Vincent Tools ecosystem and is built using the Vincent Tool SDK.

## Setup

1. Follow the global setup instructions in the repository root [CONTRIBUTING.md](../../../CONTRIBUTING.md).
2. Install dependencies:
   ```bash
   pnpm install
   ```

## Development Workflow

### Testing

Run tests:

```bash
nx test tool-transaction-signer
```

### Building the Lit Action

Build the policy:

```bash
nx action:build tool-transaction-signer
```

### Deploying the Lit Action to IPFS

Building will be done automatically. Deploy the policy:

```bash
nx action:deploy tool-transaction-signer
```

## Project Structure

- `src/`: Source code
  - `index.ts`: Main entry point

## Tool Development Guidelines

1. Use the Vincent Tool SDK to create tools
2. Define clear schemas for tool parameters
3. Implement the tool lifecycle methods (precheck, execute)
4. Handle errors gracefully
5. Write comprehensive tests for all functionality
6. Document the tool's purpose and usage

## Integration with Policies

This tool can be integrated with various Vincent Policies to enforce constraints. When developing or modifying the tool, consider how it will be used with policies such as:

- Vincent Policy Contract Whitelist

## Testing

Write unit tests for all functionality:

```bash
pnpm test
```

## Documentation

- Document the tool's purpose and usage
- Update README.md when adding new features
- Document the tool's parameters and behavior

## Pull Request Process

1. Ensure your code follows the coding standards
2. Update documentation if necessary
3. Include tests for new functionality
4. Link any related issues in your pull request description
5. Request a review from a maintainer

## Additional Resources

- [Vincent Documentation](https://docs.heyvincent.ai/)
- [Vincent Tool SDK Documentation](../../libs/tool-sdk/README.md)
