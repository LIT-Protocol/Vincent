# Contributing to Vincent Contracts

This document provides guidelines for contributing to the Vincent Contracts project.

## Overview

The Vincent Contracts project contains the Solidity smart contracts that create and manage the blockchain contracts needed to enforce user-to-app delegation, record policy parameters, and store Vincent apps' onchain data.

## Setup

1. Follow the global setup instructions in the repository root [CONTRIBUTING.md](../../CONTRIBUTING.md).
2. Install Foundry dependencies:
   ```bash
   pnpm install:contracts
   ```

## Development Workflow

### Building

Build the contracts:

```bash
pnpm build:contracts
```

### Generate ABIs and TypeScript Bindings

Generate ABIs and TypeScript bindings:

```bash
pnpm gen:contracts
```

## Project Structure

- `src/`: Source code for the Solidity contracts
  - `LibVincentDiamondStorage.sol`: Diamond storage library
  - `VincentDiamond.sol`: Diamond proxy contract
  - `VincentBase.sol`: Base contract for Vincent contracts
- `foundry.toml`: Foundry configuration
- `src.ts/`: TypeScript bindings for the contracts

## Solidity Development Guidelines

1. Follow the [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
2. Use the latest stable Solidity version
3. Write comprehensive NatSpec comments for all public functions and contracts
4. Optimize for gas efficiency
5. Follow security best practices
6. Use proper error handling with custom errors
7. Write comprehensive tests for all functionality

## Testing

Run tests using Foundry:

```bash
cd packages/vincent-contracts
forge test
```

## Security Considerations

- Always consider reentrancy attacks and use appropriate guards
- Use OpenZeppelin contracts when possible for standard functionality
- Be mindful of gas costs and optimize where necessary
- Consider the implications of upgradability
- Follow the checks-effects-interactions pattern
- Be careful with external calls and validate return values

## Documentation

- Document all contracts and public functions with NatSpec comments
- Update README.md when adding new contracts or significant functionality
- Document the contract architecture and interactions

## Pull Request Process

1. Ensure your code follows the coding standards
2. Update documentation if necessary
3. Include tests for new functionality
4. Link any related issues in your pull request description
5. Request a review from a maintainer

## For AI Editors and IDEs

When working with AI-powered editors like Cursor, GitHub Copilot, or other AI assistants in this project directory, please note:

### Context Priority

1. **Primary Context**: When working within the vincent-contracts project directory, AI editors should prioritize this CONTRIBUTING.md file and the project's README.md for specific guidance on the Solidity contracts.

2. **Secondary Context**: The root-level CONTRIBUTING.md and README.md files provide important context about how these contracts fit into the broader Vincent ecosystem.

### Key Files for Contracts Context

- `/packages/vincent-contracts/README.md`: Overview of the contracts project
- `/packages/vincent-contracts/CONTRIBUTING.md`: This file, with contract-specific contribution guidelines
- `/packages/vincent-contracts/src/`: Source code for the Solidity contracts
  - `/packages/vincent-contracts/src/LibVincentDiamondStorage.sol`: Diamond storage library
  - `/packages/vincent-contracts/src/VincentDiamond.sol`: Diamond proxy contract
  - `/packages/vincent-contracts/src/VincentBase.sol`: Base contract for Vincent contracts
- `/packages/vincent-contracts/src.ts/`: TypeScript bindings for the contracts

### Related Projects

The contracts are a core component that is used by:

- `vincent-sdk`: For interacting with the contracts
- `app-dashboard`: For frontend integration with the contracts

When working on contract code, consider these dependencies and consumers for context, as well as the Diamond pattern used for upgradability.

## Additional Resources

- [Vincent Documentation](https://docs.heyvincent.ai/)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Foundry Documentation](https://book.getfoundry.sh/)
- [OpenZeppelin Documentation](https://docs.openzeppelin.com/)
