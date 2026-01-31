## 2.0.1 (2026-01-31)

### 🧱 Updated Dependencies

- Updated e2e-test-utils to 4.1.0

# 2.0.0 (2026-01-30)

### 🧱 Updated Dependencies

- Updated ability-sdk to 3.0.2
- Updated app-sdk to 2.7.0
- Updated e2e-test-utils to 4.0.0

## 1.1.1 (2026-01-17)

### 🧱 Updated Dependencies

- Updated ability-sdk to 3.0.1
- Updated app-sdk to 2.6.1
- Updated e2e-test-utils to 3.0.1

## 1.1.0 (2026-01-14)

### 🚀 Features

- Upgrade to support Vincent 2.0 architecture ([cf97ffde](https://github.com/LIT-Protocol/Vincent/commit/cf97ffde))

### 🧱 Updated Dependencies

- Updated ability-sdk to 3.0.0
- Updated app-sdk to 2.6.0
- Updated e2e-test-utils to 3.0.0

### ❤️ Thank You

- Wyatt Barnes @Spacesai1or

## 1.0.3 (2026-01-12)

### 🧱 Updated Dependencies

- Updated e2e-test-utils to 2.0.3

## 1.0.2 (2026-01-10)

### 🧱 Updated Dependencies

- Updated ability-sdk to 2.4.2
- Updated app-sdk to 2.5.3
- Updated e2e-test-utils to 2.0.2

## 1.0.1 (2026-01-08)

### 🧱 Updated Dependencies

- Updated ability-sdk to 2.4.1
- Updated app-sdk to 2.5.2
- Updated e2e-test-utils to 2.0.1

# 1.0.0 (2026-01-07)

### ⚠️ Breaking Changes

- feat: add Relay.link gated signer ability ([3eec29cb](https://github.com/LIT-Protocol/Vincent/commit/3eec29cb))
  - **ability-relay-link**: New package - a Vincent Ability that acts as a secure gated signer for Relay.link swap operations. Supports ERC-4337 Smart Accounts (ZeroDev, Crossmint, Safe) and EOAs. Includes transaction decoding, simulation-based validation, and helpers for building/submitting UserOps.
  - **ability-sdk**: Allow `validateSimulation` and `validateTransaction` lifecycle functions to be async to support dynamic address fetching.
  - **e2e-test-utils**: Add Safe account setup helper, export Crossmint client from setup function, and rename `TEST_PLATFORM_USER_WALLET_OWNER_PRIVATE_KEY` env var to `TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY`. Update ENVs to be more chain-abstract.

### 🧱 Updated Dependencies

- Updated ability-sdk to 2.4.0
- Updated app-sdk to 2.5.1
- Updated e2e-test-utils to 2.0.0

### ❤️ Thank You

- awisniew207 @awisniew207
