# Contributing to Vincent Dashboard

## Overview

The Vincent Dashboard is a Vite React application where users interact with the Vincent system. It allows users to create apps, manage abilities and policies, update versions, manage delegatee addresses, and more. This project is part of the Vincent monorepo and is designed to be modular, maintainable, and user-friendly.

## Setup

1. Follow the global setup instructions in the repository root [README.md](../../README.md) and [CONTRIBUTING.md](../../CONTRIBUTING.md).
2. Copy `.env.example` to `.env` and fill in the required values.
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Start the dashboard in development mode:
   ```bash
   pnpm dev
   ```

## Development Workflow

- Use Nx CLI and Nx targets for building, testing, and linting when possible.
- Use the `dev` script for local development and hot reloading.
- Use the `build` script to create a production build.
- Use the `lint` script to check code quality.
- Use the `preview` script to preview the production build locally.
- Environment variables must be managed and validated via `@/config/env`.

## Project Structure

- `src/`: Source code
  - `components/`: UI components (base components in `components/ui/`)
  - `pages/`: Pages components
  - `hooks/`: Custom React hooks for business logic
  - `utils/`: Utility functions
  - `config/`: Environment variable validation and other configs
- `public/`: Static assets
- `index.html`: Main HTML entry point
- `package.json`: Project metadata and scripts
- `vite.config.ts`: Vite configuration
- `tailwind.config.ts`: Tailwind CSS configuration

## Coding Standards

- Use TypeScript throughout. Prefer `unknown` over `any` and always define clear types for props, state, and function signatures.
- Use React functional components and hooks; avoid class components.
- Use the `@/` alias for root imports; avoid long relative paths.
- Place base components in `@/components/ui`
- Avoid inline styles except for layout organization.
- Keep page components minimal; delegate logic to hooks and utilities.
- Separate business logic (hooks, utils) from UI components (View in MVC).
- Use `@/config/env` for environment variable validation and access.
- Use `react-router` for navigation and route params.
- Minimize re-renders with `useMemo` and `useCallback`.
- Follow the Single Responsibility Principle (SRP) for components and files.
- Favor composability and reusability in UI components.
- Respect the design system and share components where possible.
- Always notify users of process status and errors; never hide results.
- Prioritize readable, concise, and secure code.
- Document complex logic and non-obvious code.
- Respect linting and formatting rules.
- Design for multi-blockchain support (not just EVM).
- Minimize exposed interfaces and design for future upgrades.
- Avoid unhealthy patterns (e.g., log-and-rethrow).
- Apply DRY (Don't Repeat Yourself), KISS (Keep It Simple, Stupid), and separation of concerns principles.
- Favor hexagonal or clean architecture for new features (separate domain logic from UI and infrastructure).
- Write comprehensive unit and integration tests for all business logic and UI components.
- For general and Nx-related practices, refer to the root [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Testing

- Write unit and integration tests for all business logic and UI components.
- Use the Nx test target or the appropriate test runner for running tests.
- Ensure all tests pass before submitting a pull request.

## Documentation

- Document all public APIs, complex logic, and non-obvious code with clear comments and JSDoc where appropriate.
- Update the project README.md and this CONTRIBUTING.md when adding new features or making significant changes.

## Pull Request Process

1. Ensure your code follows the coding standards and passes linting and tests.
2. Update documentation if necessary.
3. Include tests for new features or bug fixes.
4. Link any related issues in your pull request description.
5. Request a review from a maintainer.

## For AI Editors and IDEs

When working with AI-powered editors like Cursor, GitHub Copilot, or other AI assistants in this project directory, please note:

### Context Priority

1. **Primary Context**: When working within the Dashboard project directory, AI editors should prioritize this CONTRIBUTING.md file and the project's README.md for specific guidance on the Dashboard project.
2. **Secondary Context**: The root-level CONTRIBUTING.md and README.md files provide important context about how this project fits into the broader Vincent ecosystem.

### Key Files for Dashboard Context

- `/packages/app-dashboard/README.md`: Overview of the Dashboard project
- `/packages/app-dashboard/CONTRIBUTING.md`: This file, with Dashboard-specific contribution guidelines
- `/packages/app-dashboard/src/`: Source code for the Dashboard
- `/packages/app-dashboard/src/config/env.ts`: Environment variable validation and loading

## Additional Resources

- [Vincent Documentation](https://docs.heyvincent.ai/)
- [SDK Documentation](https://sdk-docs.heyvincent.ai/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs/)
