# Contributing to Vincent Policy Spending Limit

This document provides guidelines for contributing to the Vincent Policy Spending Limit project.

## Overview

The Vincent Policy Spending Limit is a policy that can be attached to tools to avoid them spending more than a user-defined limit in a specific period of time. It's part of the Vincent Tools ecosystem and is built using the Vincent Tool SDK.

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
nx test policy-spending-limit
```

### Building the Lit Action

Build the policy:

```bash
nx action:build policy-spending-limit
```

### Deploying the Lit Action to IPFS

Building will be done automatically. Deploy the policy:

```bash
nx action:deploy policy-spending-limit
```

## Project Structure

- `src/`: Source code
  - `index.ts`: Main entry point

## Policy Development Guidelines

1. Use the Vincent Tool SDK to create policies
2. Define clear schemas for tool parameters and user parameters
3. Implement the policy lifecycle methods (evaluate, commit)
4. Handle errors gracefully
5. Write comprehensive tests for all functionality
6. Document the policy's purpose and usage

## Integration with Tools

This policy can be integrated with various Vincent Tools to enforce spending limits. When developing or modifying the policy, consider how it will be used by tools such as:

- Vincent Tool ERC20 Approval
- Vincent Tool Uniswap Swap

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
- [Vincent Tool SDK Documentation](../../libs/tool-sdk/README.md)
