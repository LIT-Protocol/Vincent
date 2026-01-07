# 2.0.0 (2026-01-07)

### 🚀 Features

- feat: add Relay.link gated signer ability ([3eec29cb](https://github.com/LIT-Protocol/Vincent/commit/3eec29cb))
  - **ability-relay-link**: New package - a Vincent Ability that acts as a secure gated signer for Relay.link swap operations. Supports ERC-4337 Smart Accounts (ZeroDev, Crossmint, Safe) and EOAs. Includes transaction decoding, simulation-based validation, and helpers for building/submitting UserOps.
  - **ability-sdk**: Allow `validateSimulation` and `validateTransaction` lifecycle functions to be async to support dynamic address fetching.
  - **e2e-test-utils**: Add Safe account setup helper, export Crossmint client from setup function, and rename `TEST_PLATFORM_USER_WALLET_OWNER_PRIVATE_KEY` env var to `TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY`. Update ENVs to be more chain-abstract.

- Adds a `enableSmartAccount` flag to the `setupVincentDevelopmentEnvironment`. Supports `safe`, `crossmint` and `zerodev` smart accounts. When the flag is set, the development environment will create a Smart Account owned by the `agentWalletOwner` (currently owns the Agent PKP for development). It will then add the Agent PKP as a signer on the Smart Account. ([77fe226d](https://github.com/LIT-Protocol/Vincent/commit/77fe226d))

### ⚠️ Breaking Changes

- Refactors dev environment to so that the dev EOA mints a Platforum User PKP which mints and owns an Agent PKP for each Vincent App ([d723a4ca](https://github.com/LIT-Protocol/Vincent/commit/d723a4ca))

### 🧱 Updated Dependencies

- Updated contracts-sdk to 6.0.0

### ❤️ Thank You

- awisniew207 @awisniew207
- Wyatt Barnes @spacesailor24

## 1.1.3 (2025-11-23)

### 🧱 Updated Dependencies

- Updated contracts-sdk to 5.0.0

## 1.1.0 (2025-11-07)

### 🚀 Features

- Adds a `setupVincentDevelopmentEnvironment` function to streamline/abstract the developer experience. ([4ddce811](https://github.com/LIT-Protocol/Vincent/commit/4ddce811))

### ❤️ Thank You

- awisniew207 @awisniew207

# 1.0.0 (2025-11-06)

### 🚀 Features

- Add logic to registerNewAppVersion to avoid registering a new App version if the given Ability and Policy config matches the latest App version. Add logic to permitAppVersionForAgentWalletPkp to avoid permitting the App version if it's already been permitted. ([bbc0b752](https://github.com/LIT-Protocol/Vincent/commit/bbc0b752))

### ⚠️ Breaking Changes

- Initial release of Vincent E2E test util methods taken from the Vincent Ability Start Kit repo ([65b0a4a6](https://github.com/LIT-Protocol/Vincent/commit/65b0a4a6))

### ❤️ Thank You

- Wyatt Barnes @spacesailor24

# Changelog

## 0.1.0

Initial release of @lit-protocol/vincent-e2e-test-utils package.
