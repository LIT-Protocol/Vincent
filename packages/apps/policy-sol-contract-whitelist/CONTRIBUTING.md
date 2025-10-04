# Contributing to Vincent Policy Solana Contract Whitelist

This document provides guidelines for contributing to the Vincent Policy Solana Contract Whitelist project.

## Overview

The Vincent Policy Solana Contract Whitelist is a policy that validates Solana transactions against a whitelist of allowed program IDs. It's part of the Vincent Policies ecosystem and is built using the Vincent Policy SDK.

## Setup

Follow the global setup instructions in the repository root [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## Development Workflow

### Testing

Run tests:

```bash
nx test policy-sol-contract-whitelist
```

### End-to-End Testing

Run end-to-end tests:

```bash
nx run abilities-e2e:test-e2e packages/apps/abilities-e2e/test-e2e/solana-transaction-signer.spec.ts
```

### Building the Lit Action

Build the policy:

```bash
nx action:build policy-sol-contract-whitelist
```

### Deploying the Lit Action to IPFS

Building will be done automatically. Deploy the policy:

```bash
nx action:deploy policy-sol-contract-whitelist
```

## Project Structure

- `src/`: Source code
  - `index.ts`: Main entry point

## Policy Development Guidelines

1. Use the Vincent Ability SDK to create policies
2. Define clear schemas for policy parameters
3. Implement the ability lifecycle methods (precheck, execute)
4. Handle errors gracefully
5. Write comprehensive tests for all functionality
6. Document the policy's purpose and usage

## Testing

Write unit tests for all functionality:

```bash
pnpm test
```

## Documentation

- Document the policy's purpose and usage
- Update README.md when adding new features
- Document the policy's parameters and behavior

## Pull Request Process

1. Ensure your code follows the coding standards
2. Update documentation if necessary
3. Include tests for new functionality
4. Link any related issues in your pull request description
5. Request a review from a maintainer

## Additional Resources

- [Vincent Documentation](https://docs.heyvincent.ai/)
- [Vincent Ability SDK Documentation](../../libs/ability-sdk/README.md)
