# Contributing to Vincent REST API

This document provides guidelines for contributing to the Vincent REST API project.

## Overview

The Vincent REST API is an offchain service that increases the available information that Vincent apps can show to their users. It offers discoverability and auditability services that would be too expensive to store onchain but are not mission-critical to require that immutability.

## Setup

1. Follow the global setup instructions in the repository root [CONTRIBUTING.md](../../CONTRIBUTING.md).
2. Install dependencies:
   ```bash
   pnpm install
   ```

## Development Workflow

### Generating API Client

Generate the OpenAPI specification and TypeScript client:

```bash
pnpm generate-api
```

This command:

1. Converts Zod schemas to an OpenAPI specification using `@asteasolutions/zod-to-openapi`
2. Generates the OpenAPI JSON file in `src/generated/openapi.json`
3. Creates a TypeScript client with RTK Query in the `src/generated/api` directory

## Project Structure

- `src/`: Source code
  - `api/`: API definitions and controllers
  - `generated/`: Generated OpenAPI and client code
    - `api/`: RTK Query API client
    - `openapi.json`: Generated OpenAPI specification
  - `tests/`: Integration tests
  - `utils/`: Utility scripts for API generation
    - `generate-openapi.ts`: Script to generate OpenAPI specs from Zod schemas
- `docs/`: API documentation
  - `api.html`: API documentation viewer using RapiDoc
- `rtk-client-config.js`: RTK Query codegen configuration

## API Development Guidelines

1. Define all API schemas using Zod
2. Use OpenAPI extensions to provide additional metadata
3. Follow RESTful API design principles
4. Implement proper error handling and status codes
5. Document all endpoints with clear descriptions
6. Write integration tests for all endpoints

## Testing

Run tests:

```bash
pnpm test
```

## Documentation

- Document all API endpoints with clear descriptions
- Update the OpenAPI specification when adding new endpoints
- Generate and review API documentation

## Pull Request Process

1. Ensure your code follows the coding standards
2. Update documentation if necessary
3. Include tests for new endpoints or functionality
4. Link any related issues in your pull request description
5. Add an nx version plan documenting your changes
6. Request a review from a maintainer

## Technologies Used

- [Zod](https://github.com/colinhacks/zod) - Schema validation
- [@asteasolutions/zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi) - Convert Zod schemas to OpenAPI
- [RTK Query](https://redux-toolkit.js.org/rtk-query/overview) - API client generation
- [Express](https://expressjs.com/) - API server for testing
- [Jest](https://jestjs.io/) - Testing framework

## For AI Editors and IDEs

When working with AI-powered editors like Cursor, GitHub Copilot, or other AI assistants in this project directory, please note:

### Context Priority

1. **Primary Context**: When working within the vincent-rest-api project directory, AI editors should prioritize this CONTRIBUTING.md file and the project's README.md for specific guidance on the REST API.

2. **Secondary Context**: The root-level CONTRIBUTING.md and README.md files provide important context about how this API fits into the broader Vincent ecosystem.

### Key Files for REST API Context

- `/packages/vincent-rest-api/README.md`: Overview of the REST API project
- `/packages/vincent-rest-api/CONTRIBUTING.md`: This file, with API-specific contribution guidelines
- `/packages/vincent-rest-api/src/api/`: API definitions and controllers
- `/packages/vincent-rest-api/src/generated/openapi.json`: Generated OpenAPI specification
- `/packages/vincent-rest-api/docs/api.html`: API documentation viewer

### Related Projects

The REST API is used by:

- `app-dashboard`: For frontend integration with the API
- Vincent apps: For retrieving additional information about Vincent apps

When working on API code, consider these consumers for context, and focus on maintaining backward compatibility and proper documentation of endpoints.

## Additional Resources

- [Vincent Documentation](https://docs.heyvincent.ai/)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [RESTful API Design Best Practices](https://restfulapi.net/)
