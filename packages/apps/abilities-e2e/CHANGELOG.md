## 0.1.1 (2025-07-09)

### 🩹 Fixes

- Remove unused commit test case imports ([e227396f](https://github.com/LIT-Protocol/Vincent/commit/e227396f))

### ❤️ Thank You

- Daryl Collins

## 0.1.0 (2025-07-08)

### 🚀 Features

- - Implement policy failures e2e test suite ([64b736c8](https://github.com/LIT-Protocol/Vincent/commit/64b736c8))
- - Implement support for building and deploying fixture policies ([b98cbe16](https://github.com/LIT-Protocol/Vincent/commit/b98cbe16))
- #### Implement e2e test suite to verify result handling ([ac9f7138](https://github.com/LIT-Protocol/Vincent/commit/ac9f7138))

  - Implemented modified (parameterized) esbuild and deploy-to-ipfs scripts from our existing abilities that will bundle and deploy all of the abilities that are locally defined in the `abilities-e2e` project
  - Defined E2E fixture abilities for verifying fail and success behaviour of abilities that are executed using the `VincentAbilityClient`.
  - Added `responseTests.spec.ts` file that runs `precheck()` and `execute()` for every fixture ability and verifies the results are the correct shape
  - Verifies both with and without schema cases with and without results, and case where an error is thrown from inside the lifecycle function

### 🧱 Updated Dependencies

- Updated ability-sdk to 1.0.2
- Updated app-sdk to 1.0.2
- Updated policy-spending-limit to 1.0.2
- Updated ability-erc20-approval to 1.0.2
- Updated ability-uniswap-swap to 1.0.2

### ❤️ Thank You

- Daryl Collins
