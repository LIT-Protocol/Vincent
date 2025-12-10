## 1.2.1 (2025-12-10)

### 🩹 Fixes

- Fix published package to include smart account functionality that was missing from the 1.2.0 release build. ([f327df67](https://github.com/LIT-Protocol/Vincent/commit/f327df67))

## 1.2.0 (2025-12-09)

### 🚀 Features

- Adds a `smartAccountType` parameter to the `setupVincentDevelopmentEnvironment`. Supports `safe`, `crossmint` and `zerodev` smart accounts. When the parameter is set, the development environment will create a Smart Account owned by the `agentWalletOwner` (currently owns the Agent PKP for development). It will then add the Agent PKP as a signer on the Smart Account. ([fe037134](https://github.com/LIT-Protocol/Vincent/commit/fe037134))

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
