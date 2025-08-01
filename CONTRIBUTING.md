# Contributing to Vincent

Vincent is a monorepo that contains multiple projects for the Vincent Agent Wallet system, a decentralized permission management framework designed to allow third-party applications to request users for permission to execute transactions on their behalf.

## Repository Structure

The repository is managed with [Nx](https://nx.dev/) and [pnpm](https://pnpm.io/). The monorepo structure allows for sharing code between projects while maintaining separation of concerns.

- `/packages`: Contains all the projects in the monorepo

## Overview

The Vincent system consists of several key components:

- **app-dashboard**: A Vite React app where users interact with the Vincent system, allowing them to create apps with their abilities and policies, update versions, manage delegatee addresses, and more.
- **app-sdk**: A TypeScript SDK that exposes useful abilities to interact with Vincent systems in web or Node.js environments.
- **contracts-sdk**: Solidity contracts that create and manage the blockchain contracts needed to enforce user-to-app delegation, record policy parameters, and store Vincent apps' onchain data.
- **registry-sdk**: REST API for an offchain service increasing the available info that Vincent apps can show to their users, offering discoverability and auditability services.
- **policy-spending-limit**: A policy that can be attached to abilities to avoid them spending more than a user-defined limit in a specific period of time.
- **ability-erc20-approval**: An ability to send ERC20 approve/allowance transactions from a Vincent app on behalf of the delegator.
- **ability-sdk**: An SDK exposing utilities to develop Vincent abilities and policies.
- **ability-aave**: An ability to interact with Aave protocol from a Vincent app on behalf of the delegator.
- **ability-debridge**: An ability to utilize cross-chain bridging through Debridge from a Vincent app on behalf of the delegator.
- **ability-transaction-signer**: An ability to sign transactions from a Vincent app on behalf of the delegator.
- **ability-uniswap-swap**: An ability to trigger swaps on Uniswap from a Vincent app on behalf of the delegator.
- **ability-morpho**: An ability to operate on Morpho vaults from a Vincent app on behalf of the delegator.
- **policy-contract-whitelist**: A policy that restricts interactions to a predefined set of whitelisted contract addresses.
- **policy-send-counter**: A policy that limits the number of transactions that can be sent within a specific time period.
- **mcp-sdk**: A Model Context Protocol Wrapper that converts any Vincent app into an MCP server that can be connected to any LLM client to provide it with Vincent abilities.
- **mcp**: An MCP runner

## Getting Started

### Prerequisites

- Node.js (v20.11.1 or later)
- pnpm (v10.7.0)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/LIT-Protocol/Vincent.git
   cd Vincent
   ```

2. Ensure pnpm is available:

   ```bash
   corepack enable
   ```

3. Install dependencies:

   ```bash
   pnpm install
   ```

4. Build all projects:
   ```bash
   pnpm build
   ```

## Development Workflow

### Common Commands

- Build all projects: `pnpm build`
- Test all projects: `pnpm test`
- Lint all projects: `pnpm lint`
- Format code: `pnpm format`
- Start the dashboard in development mode: `pnpm dev:dashboard`
- Build the dashboard for production: `pnpm build:dashboard`
- Start the dashboard in production mode: `pnpm start:dashboard`
- Generate SDK documentation: `pnpm start:docs`
- Install contract dependencies: `pnpm install:contracts`
- Build contracts: `pnpm build:contracts`
- Clean the repository: `pnpm clean`

### Project-Specific Development

Each project has its own README.md and CONTRIBUTING.md files with project-specific instructions. Please refer to these files for detailed information about developing for a specific project.

## Contribution Guidelines

### Nx and Tooling Best Practices

- Use Nx-specific configuration files (e.g., `project.json`, `eslint.config.js`, `nx.json`) for project and tool configuration. Avoid duplicating configuration in `package.json` if it can be placed in a dedicated file.
- Place all new configuration in the appropriate Nx or tool-specific file, not in `package.json`.
- Use Nx CLI and Nx plugins for all build, test, lint, and release tasks. Prefer Nx targets over custom scripts in `package.json`.
- Use Nx for dependency graph management, affected commands, and workspace orchestration.
- Use Nx-native environment variable loading and validation (e.g., with `@t3-oss/env-core` and Zod schemas) in both Node and browser projects.
- Keep environment variable validation and loading in a single file per project (e.g., `src/env.ts` or `src/config/env.ts`).
- Use Nx dependency constraints and enforce module boundaries via `eslint.config.js`.
- Use Nx plugins for TypeScript, Jest, and ESLint as configured in `nx.json`.
- Use Nx's affected commands for efficient CI and local workflows.

### Environment Management

- Use `.env.example` as a template for required environment variables.
- Validate all environment variables at runtime using Zod schemas.
- For Node projects, use `process.env`; for browser projects, use `import.meta.env` with a prefix (e.g., `VITE_`).
- Never commit secrets or real `.env` files.

### Architecture and Software Engineering Best Practices

- Follow the DRY (Don't Repeat Yourself) principle.
- Design files, classes, and modules with a single responsibility.
- Separate model, view, and controller logic (MVC) or follow a hexagonal/clean architecture where possible.
- Keep code simple and maintainable ("Keep It Simple, Stupid" - KISS).
- Write modular, composable, and testable code.
- Document complex logic and public APIs using standards such as Typedoc.
- Use strong typing and avoid `any` (prefer `unknown` if necessary).
- Write comprehensive unit and integration tests.
- Use ESLint and Prettier for code quality, and respect the shared `eslint.config.js`.
- Use project-specific `CONTRIBUTING.md` and `README.md` for details unique to each package.
- Favor hexagonal (ports and adapters) or clean architecture for new modules.
- Separate business logic from infrastructure and UI.
- Use dependency injection and inversion of control where appropriate.
- Design for testability and future extensibility.

### Code Style and Quality

- Follow the TypeScript coding standards and use proper typing
- Write clean, readable, and maintainable code
- Document your code with comments and JSDoc when necessary
- Write unit tests for your code
- Use ESLint and Prettier for code formatting and linting

### Git Workflow

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Run tests and ensure they pass
5. Submit a pull request to the `main` branch

### Pull Request Process

1. Ensure your code follows the coding standards
2. Update documentation if necessary
3. Include tests for new features or bug fixes
4. Link any related issues in your pull request description
5. Create a version plan with `nx release plan` describing your changes and indicating the needed version bump for each project
6. Request a review from a maintainer

### Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for your commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types include:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: Performance improvements
- `test`: Adding or fixing tests
- `chore`: Changes to the build process or auxiliary abilities

### Release Process

Each package handles its own release cycle as they are fundamentally independent. The release process is managed by Nx with the `pnpm release` command.

## For AI Editors and IDEs

This repository is structured as a monorepo with multiple projects, each with its own documentation. When working with AI-powered editors like Cursor, GitHub Copilot, or other AI assistants, please note:

### Context Hierarchy

1. **Root Context**: When working at the repository root, AI editors should consider all documentation files (README.md, CONTRIBUTING.md) at the root level to understand the overall project structure and contribution guidelines.

2. **Project-Specific Context**: When working within a specific project directory (e.g., `/packages/sdk/`), AI editors should prioritize the project-specific documentation (README.md, CONTRIBUTING.md) in that directory, while still being aware of the root context.

### Important Files for Context

- Root `/README.md`: Overview of the entire Vincent system
- Root `/CONTRIBUTING.md`: General contribution guidelines for all projects
- Project-specific `/packages/<project>/README.md`: Detailed information about a specific project
- Project-specific `/packages/<project>/CONTRIBUTING.md`: Project-specific contribution guidelines

### Context Loading Strategy

AI editors should:

1. First load the project-specific documentation when working in a project directory
2. Supplement with root documentation for overall context
3. Consider relationships between projects as described in the root documentation

This approach ensures that AI editors provide relevant, project-specific assistance while maintaining awareness of the broader system architecture.

## Additional Resources

- [Vincent Documentation](https://docs.heyvincent.ai/)
- [SDK Documentation](https://sdk-docs.heyvincent.ai/)
- [GitHub Repository](https://github.com/LIT-Protocol/Vincent)
- [Issue Tracker](https://github.com/LIT-Protocol/Vincent/issues)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
