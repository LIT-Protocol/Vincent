## 1.0.4 (2025-06-20)

### 🩹 Fixes

- Add lazy hook generation to the `rtk-client-config`, export lazy hooks within the `vincentApiClient` ([d99721a0](https://github.com/LIT-Protocol/Vincent/commit/d99721a0))

### ❤️ Thank You

- Andrew Wisniewski

## 1.0.3 (2025-06-19)

### 🩹 Fixes

- Fix regression in OpenAPI spec - remove /api/v1 prefix ([bcc809b7](https://github.com/LIT-Protocol/Vincent/commit/bcc809b7))
- Fixed the response of POST /policy to only return the Policy, not the PolicyVersion ([455702af](https://github.com/LIT-Protocol/Vincent/commit/455702af))

  Added a new ChangeOwner schema for changing the owner address of tools and policies
  Added appId property on CreateApp. We need this because:
  The contract will generate the unique appId, which is sent by the client to our registry
  New EditApp schema. The OpenAPI spec was using the schema for CreateApp, but since it'll include an appId, tools, and policies, we can no longer use it. It also removes managerAddress from the schema, since (I believe) we decided that it cannot be changed as the app manager
  Created a simple GetToolPolicy schema in base.ts. Since the packageName is part of the route parameters and not the request body, we can't have a shared schema for the OpenAPI routes and rendering forms on the FE here. Because of this, we'll use this simple schema for the forms, and it will take the given packageName and use it as a route parameter. I couldn't think of a implementation for this that allows for a shared schema without making packageName part of the request body. This will cover rendering forms for GET tool/policy version(s)

- Add `creationSchemas` export with ZOD schemas for creation payloads ([455702af](https://github.com/LIT-Protocol/Vincent/commit/455702af))
- Add `version` to policy creation schema ([455702af](https://github.com/LIT-Protocol/Vincent/commit/455702af))

### ❤️ Thank You

- Daryl Collins

## 1.0.2 (2025-06-01)

### 🩹 Fixes

- - Add `version` property to create new tool endpoint ([5266cd2](https://github.com/LIT-Protocol/Vincent/commit/5266cd2))

### ❤️ Thank You

- Daryl Collins

## 1.0.1 (2025-05-31)

### 🩹 Fixes

- - Export ZOD schemas of doc definitions in ([d8a3755](https://github.com/LIT-Protocol/Vincent/commit/d8a3755))
- ### Route Changes ([ca978e7](https://github.com/LIT-Protocol/Vincent/commit/ca978e7))

  - Removed route namespacing; all routes are now at the root instead of all nested under `/api/v1`
  - Add "list all apps" route `GET /apps`
  - Replace `toggle` with explicit `enable` and `disable` endpoints for appVersion

  #### Internal

  - Added chokidar watch task for `dev` auto-generate API on edit of `src/lib/**/*`

### ❤️ Thank You

- Daryl Collins

# 1.0.0 (2025-05-30)

### ⚠️ Breaking Changes

- ## Initial Release: vincent-registry-sdk ([13d6bf5](https://github.com/LIT-Protocol/Vincent/commit/13d6bf5))

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
