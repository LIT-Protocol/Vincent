# Contributing to Vincent Ability Debridge

This document provides guidelines for contributing to the Vincent Ability Debridge project.

## Overview

The Vincent Ability Debridge is a ability to send deposit, withdraw or redeem Debridge transactions from a Vincent app on behalf of the delegator. It's part of the Vincent Abilities ecosystem and is built using the Vincent Ability SDK.

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
nx test ability-debridge
```

### Building the Lit Action

Build the ability:

```bash
nx action:build ability-debridge
```

### Deploying the Lit Action to IPFS

Building will be done automatically. Deploy the ability:

```bash
nx action:deploy ability-erc20-approval
```

## Project Structure

- `src/`: Source code
  - `index.ts`: Main entry point

## Ability Development Guidelines

1. Use the Vincent Ability SDK to create abilitys
2. Define clear schemas for ability parameters
3. Implement the ability lifecycle methods (precheck, execute)
4. Handle errors gracefully
5. Write comprehensive tests for all functionality
6. Document the ability's purpose and usage

## Integration with Policies

This ability can be integrated with various Vincent Policies to enforce constraints. When developing or modifying the ability, consider how it will be used with policies such as:

- Vincent Policy Spending Limit

## Testing

Write unit tests for all functionality:

```bash
pnpm test
```

## Documentation

- Document the ability's purpose and usage
- Update README.md when adding new features
- Document the ability's parameters and behavior

## Pull Request Process

1. Ensure your code follows the coding standards
2. Update documentation if necessary
3. Include tests for new functionality
4. Link any related issues in your pull request description
5. Request a review from a maintainer

## Additional Resources

- [Vincent Documentation](https://docs.heyvincent.ai/)
- [Vincent Ability SDK Documentation](../../libs/ability-sdk/README.md)
- [ERC20 Standard](https://eips.ethereum.org/EIPS/eip-20)
- [ERC4626 Standard](https://eips.ethereum.org/EIPS/eip-4626)
