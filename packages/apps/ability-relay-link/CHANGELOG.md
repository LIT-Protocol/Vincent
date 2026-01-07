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
