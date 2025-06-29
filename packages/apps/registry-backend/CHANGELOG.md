## 1.3.0 (2025-06-29)

### 🚀 Features

- #### Support `deploymentStatus` for Tools and Policies ([e50ded25](https://github.com/LIT-Protocol/Vincent/commit/e50ded25))

  - Implemented support for the `deploymentStatus` property for Tool and Policy.
  - It defaults to `dev` for new entities.

### 🧱 Updated Dependencies

- Updated registry-sdk to 3.3.0

### ❤️ Thank You

- Daryl Collins

## 1.2.0 (2025-06-29)

### 🚀 Features

- ### Implement undelete routes for deletable entities ([f5ef06de](https://github.com/LIT-Protocol/Vincent/commit/f5ef06de))

  - Added route handlers to support undeletion of `App`, `AppVersion`, `AppVersionTool`, `Tool`, `ToolVersion, `Policy`, and `PolicyVersion`

### 🩹 Fixes

- Return deleted appTools to the frontend ([d6a90c8f](https://github.com/LIT-Protocol/Vincent/commit/d6a90c8f))

### 🧱 Updated Dependencies

- Updated registry-sdk to 3.2.0

### ❤️ Thank You

- Daryl Collins

## 1.1.0 (2025-06-28)

### 🚀 Features

- ### Implement new delete endpoints ([e471c780](https://github.com/LIT-Protocol/Vincent/commit/e471c780))

  - Implemented delete endpoints for AppVersion, and AppToolVersion, PolicyVersion, and ToolVersion
  - Updated integration tests to verify the new routes functionality and security / authorization constraints

### 🩹 Fixes

- ### Bug Fix ([8d646d44](https://github.com/LIT-Protocol/Vincent/commit/8d646d44))

  - Fix non-functional change owner endpoint logic for policies and tools; bug introduced in v1.0.0
  - Added explicit integration tests to verify changeOwner is working as expected, in the authorization suite

### 🧱 Updated Dependencies

- Updated registry-sdk to 3.1.0

### ❤️ Thank You

- Daryl Collins

# 1.0.0 (2025-06-28)

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

### 🧱 Updated Dependencies

- Updated registry-sdk to 3.0.0

### ❤️ Thank You

- Daryl Collins

## 0.2.2 (2025-06-27)

### 🩹 Fixes

- Fix type of `supportedPolicies` - it is an object, not a string array ([cd19e94f](https://github.com/LIT-Protocol/Vincent/commit/cd19e94f))

### 🧱 Updated Dependencies

- Updated registry-sdk to 2.2.1

### ❤️ Thank You

- Daryl Collins

## 0.2.1 (2025-06-26)

### 🩹 Fixes

- Fix mkdtemp not found in production deployment to Heroku ([92733bbd](https://github.com/LIT-Protocol/Vincent/commit/92733bbd))

  - The ESM version of `fs-extra` doesn't pass through methods through; when we deploy to production, that's the package that gets used
  - This was working coincidentally for local dev because of transpilation / CJS references. :sad_panda:

### ❤️ Thank You

- Daryl Collins

## 0.2.0 (2025-06-25)

### 🚀 Features

- Implement detection of `supportedPolicies` and `policiesNotInRegistry` during toolVersion creation ([72881266](https://github.com/LIT-Protocol/Vincent/commit/72881266))
- Implement loading of IPFS CID, uiSchema, jsonSchema from `vincent-tool-metadata.json` or `vincent-policy-metadata.json` files published in the NPM package. ([23dc7be0](https://github.com/LIT-Protocol/Vincent/commit/23dc7be0))

### 🧱 Updated Dependencies

- Updated registry-sdk to 2.2.0

### ❤️ Thank You

- Daryl Collins

## 0.1.0 (2025-06-25)

### 🚀 Features

- Implemented routes for managing app tools ([13a0ce44](https://github.com/LIT-Protocol/Vincent/commit/13a0ce44))

### 🧱 Updated Dependencies

- Updated registry-sdk to 2.1.0

### ❤️ Thank You

- Daryl Collins
