## 4.1.0 (2025-08-15)

### 🚀 Features

- ## Add gas sponsorship for LIT chain usage by delegatees ([3d693e16](https://github.com/LIT-Protocol/Vincent/commit/3d693e16))

  - New endpoint added (`/app/{appId}/sponsorDelegateesPayment`) which sponsors gas usage on Yellowstone for all delegateeAddresses on the target app

### ❤️ Thank You

- Daryl Collins

# 4.0.0 (2025-08-05)

### 🚀 Features

- ### Add logo support for abilities and policies ([6ef30e41](https://github.com/LIT-Protocol/Vincent/commit/6ef30e41))

  - Added optional `logo` property to endpoint definitions for both abilities and policies during creationg and editing

- Add new `setActiveVersion` endpoint definition to allow atomic setting of activeVersion on apps without using the general edit endpoint ([169b6a1e](https://github.com/LIT-Protocol/Vincent/commit/169b6a1e))

### ⚠️ Breaking Changes

- #### Replace SIWE auth with JWT auth ([e9a5b5be](https://github.com/LIT-Protocol/Vincent/commit/e9a5b5be))

  - JWTs must be issued by Vincent JWT code (assumed linked to a valid Datil PKP) for this authentication

### ❤️ Thank You

- Daryl Collins

## 3.3.2 (2025-07-09)

### 🚀 Features

- #### Add delegateeAddresses to Apps in the Registry ([1424ec10](https://github.com/LIT-Protocol/Vincent/commit/1424ec10))

  - Added arrays of delegateeAddresses to the app doc, as well as its creation and editing.

### ❤️ Thank You

- Andrew Wisniewski

## 3.3.1 (2025-07-01)

### 🩹 Fixes

- #### Minor schema improvements ([4e092830](https://github.com/LIT-Protocol/Vincent/commit/4e092830))

  - Added minimum lengths for App/Ability/Policy name/title and description/changes. Requirement of unique App `redirectUris`, and Ability title is required
  - Added `isDeleted` to all App/Ability/Policy objects
  - Exports `changeOwner` from the `baseSchemas`

### ❤️ Thank You

- Andrew Wisniewski

## 3.3.0 (2025-06-29)

### 🚀 Features

- #### Support `deploymentStatus` for Abilities and Policies ([72a54eff](https://github.com/LIT-Protocol/Vincent/commit/72a54eff))

  - Defined `deploymentStatus` property for Ability and Policy. It defaults to `dev` for new entities.

### ❤️ Thank You

- Daryl Collins

## 3.2.0 (2025-06-29)

### 🚀 Features

- ### Define undelete routes for deletable entities ([6812fa02](https://github.com/LIT-Protocol/Vincent/commit/6812fa02))

  - Added endpoint definitions to support undeletion of `App`, `AppVersion`, `AppVersionAbility`, `Ability`, `AbilityVersion, `Policy`, and `PolicyVersion`

### ❤️ Thank You

- Daryl Collins

## 3.1.0 (2025-06-28)

### 🚀 Features

- ### Define new delete endpoints ([ad7c85e9](https://github.com/LIT-Protocol/Vincent/commit/ad7c85e9))

  - Defined delete endpoints for AppVersion, and AppAbilityVersion, PolicyVersion, and AbilityVersion

### ❤️ Thank You

- Daryl Collins

# 3.0.0 (2025-06-28)

### ⚠️ Breaking Changes

- #### Add SIWE authentication ([e3d7c886](https://github.com/LIT-Protocol/Vincent/commit/e3d7c886))

  - Defined a new `siweAuth` securitySchema and applied it to all PUT, POST and DELETE endpoints
  - SIWE auth is a custom Authorization scheme, using the prefix `SIWE:`, but is considered an `apiKey` semantically for compatibility purposes
  - Implemented Metamask integration for getting SIWEs in the RapiDoc UI so we can still use it to test endpoints directly
  - Added server selection to the RapiDoc endpoint
  - Add authentication checks to all mutation endpoints in the registry backend. Wallet A cannot edit Wallet B's resources.
    **- Owner and manager wallet can no longer be provided as arguments in the endpoint payloads; they are always set during creation by getting the address of the signed SIWE**
  - Implement integration test suite that verifies they are working as expected
  - Updated tooling in the registry-backend to use the RapiDoc code that is in the registry-sdk instead of in-lining its own inside the express route

  ### Define tags per endpoint to support automatic cache invalidation

  - Defined `tags` for all endpoints
  - The RTK query client will now automatically refetch data for any existing subscriptions when a mutation occurs
  - The tags are extremely simplistic, generic, and pessimistic. Basically, when an entity changes we reload all data for all entities of the same time. We will make this less pessimistic by using `.enhanceEndpoints` in a follow-up release.

  ### Internal

  - Added `debug` package and implemented trace logging that can be toggled on per module by setting the appropriate path in the DEBUG env var.
  - Replaced 'verboseLog()' functionality in the tests with usage of `debug()`
  - Added logging to middleware to help verify they are all functioning as expected

### ❤️ Thank You

- Daryl Collins

## 2.2.1 (2025-06-27)

### 🩹 Fixes

- Fix type of `supportedPolicies` - it is an object, not a string array ([cd19e94f](https://github.com/LIT-Protocol/Vincent/commit/cd19e94f))

### ❤️ Thank You

- Daryl Collins

## 2.2.0 (2025-06-25)

### 🚀 Features

- Add `policiesNotInRegistry` to `abilityVersion` type ([cd6bc46c](https://github.com/LIT-Protocol/Vincent/commit/cd6bc46c))

### ❤️ Thank You

- Daryl Collins

## 2.1.0 (2025-06-25)

### 🚀 Features

- Add endpoint to allow editing of `supportedPolicies` for app abilities. ([2615143d](https://github.com/LIT-Protocol/Vincent/commit/2615143d))

### ❤️ Thank You

- Daryl Collins

# 2.0.0 (2025-06-24)

### 🚀 Features

- Enabled lazy hook generation ([cb414c1f](https://github.com/LIT-Protocol/Vincent/commit/cb414c1f))

### ⚠️ Breaking Changes

- ## Add NodeJS RTK client support ([4263b314](https://github.com/LIT-Protocol/Vincent/commit/4263b314))

  ### Configurable `baseQueryFn`

  Consumers of the registry-sdk can now set their own baseQueryFn on the exported client singletons. The package-level exports have been renamed to avoid same-name nested variables which are awkward to destructure. See examples below for usage.

  #### React Client

  ```typescript
  import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
  import { reactClient } from '@lit-protocol/vincent-registry-sdk';
  const { vincentApiClientReact, setBaseQueryFn } = reactClient;
  setBaseQueryFn(fetchBaseQuery({ baseUrl: `https://registry.heyvincent.ai` }));
  // Use the API client per https://redux-toolkit.js.org/rtk-query/api/created-api/hooks
  ```

  #### NodeJS Client

  ```typescript
  import { fetchBaseQuery } from '@reduxjs/toolkit/query';
  import { nodeClient } from '@lit-protocol/vincent-registry-sdk';
  const { vincentApiClientNode, setBaseQueryFn } = nodeClient;
  setBaseQueryFn(fetchBaseQuery({ baseUrl: `http://localhost:3000` }));
  // Use the API Client per https://redux-toolkit.js.org/rtk-query/usage/usage-without-react-hooks
  ```

### ❤️ Thank You

- Daryl Collins

## 1.0.4 (2025-06-20)

### 🩹 Fixes

- Add lazy hook generation to the `rtk-client-config`, export lazy hooks within the `vincentApiClient` ([d99721a0](https://github.com/LIT-Protocol/Vincent/commit/d99721a0))

### ❤️ Thank You

- Andrew Wisniewski

## 1.0.3 (2025-06-19)

### 🩹 Fixes

- Fix regression in OpenAPI spec - remove /api/v1 prefix ([bcc809b7](https://github.com/LIT-Protocol/Vincent/commit/bcc809b7))
- Fixed the response of POST /policy to only return the Policy, not the PolicyVersion ([455702af](https://github.com/LIT-Protocol/Vincent/commit/455702af))

  Added a new ChangeOwner schema for changing the owner address of abilities and policies
  Added appId property on CreateApp. We need this because:
  The contract will generate the unique appId, which is sent by the client to our registry
  New EditApp schema. The OpenAPI spec was using the schema for CreateApp, but since it'll include an appId, abilities, and policies, we can no longer use it. It also removes managerAddress from the schema, since (I believe) we decided that it cannot be changed as the app manager
  Created a simple GetAbilityPolicy schema in base.ts. Since the packageName is part of the route parameters and not the request body, we can't have a shared schema for the OpenAPI routes and rendering forms on the FE here. Because of this, we'll use this simple schema for the forms, and it will take the given packageName and use it as a route parameter. I couldn't think of a implementation for this that allows for a shared schema without making packageName part of the request body. This will cover rendering forms for GET tool/policy version(s)

- Add `creationSchemas` export with ZOD schemas for creation payloads ([455702af](https://github.com/LIT-Protocol/Vincent/commit/455702af))
- Add `version` to policy creation schema ([455702af](https://github.com/LIT-Protocol/Vincent/commit/455702af))

### ❤️ Thank You

- Daryl Collins

## 1.0.2 (2025-06-01)

### 🩹 Fixes

- - Add `version` property to create new ability endpoint ([5266cd2](https://github.com/LIT-Protocol/Vincent/commit/5266cd2))

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
