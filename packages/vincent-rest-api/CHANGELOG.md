# 1.0.0 (2025-05-30)

### ⚠️  Breaking Changes

- ## Initial Release: vincent-rest-api ([13d6bf5](https://github.com/LIT-Protocol/Vincent/commit/13d6bf5))

  ### Features
  **REST API Client**
  - Added - Auto-generated TypeScript REST API client for Vincent services `vincentApiClient`
  - Provides type-safe HTTP client methods for all Vincent REST endpoints
  **OpenAPI Integration**
  - Exported `openApiJson` - Complete OpenAPI 3.0 specification as importable JSON
  - Exported - Runtime OpenAPI registry for schema validation and documentation `openAPIRegistry`
  - Enables integration with OpenAPI tooling and documentation generators
  **Auto-Generated from API Definition**
  - All exports are automatically generated from the latest API specification
  - Ensures client-server contract consistency through build-time generation
  - Type definitions stay in sync with backend API changes

### ❤️ Thank You

- Daryl Collins