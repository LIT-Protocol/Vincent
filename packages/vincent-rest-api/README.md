# Vincent Registry API

This package contains the Vincent Registry API. It includes API definitions using Zod with OpenAPI extensions, a generated TypeScript client using RTK Query.

## Getting Started

### Generate API Client

To generate the OpenAPI specification and TypeScript client:

```bash
pnpm generate-api
```

This command:
1. Converts Zod schemas to an OpenAPI specification using `@asteasolutions/zod-to-openapi`
2. Generates the OpenAPI JSON file in `src/generated/openapi.json`
3. Creates a TypeScript client with RTK Query in the `src/generated/api` directory

## Directory Structure

```
vincent-rest-api/
├── src/                        # Source code
│   ├── api/                    # API definitions and controllers
│   ├── generated/              # Generated OpenAPI and client code
│   │   ├── api/                # RTK Query API client
│   │   └── openapi.json        # Generated OpenAPI specification
│   ├── tests/                  # Integration tests
│   │   └── integration.test.txt # API integration tests (WIP)
│   └── utils/                  # Utility scripts for API generation
│       └── generate-openapi.ts # Script to generate OpenAPI specs from Zod schemas
├── docs/                       # API documentation
│   └── api.html                # API documentation viewer using RapiDoc
├── rtk-client-config.js           # RTK Query codegen configuration
├── package.json                # Project dependencies and scripts
└── README.md                   # Project documentation
```

## Technologies

- [Zod](https://github.com/colinhacks/zod) - Schema validation
- [@asteasolutions/zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi) - Convert Zod schemas to OpenAPI
- [RTK Query](https://redux-toolkit.js.org/rtk-query/overview) - API client generation
- [Express](https://expressjs.com/) - API server for testing
- [Jest](https://jestjs.io/) - Testing framework 
