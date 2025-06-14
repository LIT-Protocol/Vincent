# Contributing to Vincent Tool Uniswap Swap

This document provides guidelines for contributing to the Vincent Tool Uniswap Swap project.

## Overview

The Vincent Tool Uniswap Swap is a tool to trigger swaps on Uniswap from a Vincent app on behalf of the delegator. It's part of the Vincent Tools ecosystem and is built using the Vincent Tool SDK.

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
nx test vincent-tool-uniswap-swap
```

### Building the Lit Action

Build the policy:

```bash
nx action:build vincent-tool-uniswap-swap
```

### Deploying the Lit Action to IPFS

Building will be done automatically. Deploy the policy:

```bash
nx action:deploy vincent-tool-uniswap-swap
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

- Vincent Policy Spending Limit

## Uniswap Integration

This tool integrates with Uniswap V3 for token swaps. When working with this tool, consider:

1. Understanding the Uniswap V3 SDK and how it works
2. Handling token approvals before swaps
3. Managing slippage and price impact
4. Handling different token decimals
5. Supporting multiple chains and Uniswap deployments

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
- [Vincent Tool SDK Documentation](../vincent-tool-sdk/README.md)
- [Uniswap V3 Documentation](https://docs.uniswap.org/protocol/V3/introduction)
- [Uniswap V3 SDK](https://docs.uniswap.org/sdk/v3/overview)
