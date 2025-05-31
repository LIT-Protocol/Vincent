## 1.0.1 (2025-05-31)

### 🩹 Fixes

- - Export ZOD schemas of doc definitions in  ([d8a3755](https://github.com/LIT-Protocol/Vincent/commit/d8a3755))
- ### Route Changes ([ca978e7](https://github.com/LIT-Protocol/Vincent/commit/ca978e7))

  - Removed route namespacing; all routes are now at the root instead of all nested under `/api/v1` 
  - Add "list all apps" route `GET /apps`
  - Replace `toggle` with explicit `enable` and `disable` endpoints for appVersion
  #### Internal
  - Added chokidar watch task for `dev` auto-generate API on edit of `src/lib/**/*`

### ❤️ Thank You

- Daryl Collins

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