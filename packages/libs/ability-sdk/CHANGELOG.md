## 2.0.1 (2025-09-03)

### 🧱 Updated Dependencies

- Updated contracts-sdk to 1.1.0

# 2.0.0 (2025-08-05)

### 🚀 Features

- Add descriptions on abilities and their api interface params ([0b8ff1e3](https://github.com/LIT-Protocol/Vincent/commit/0b8ff1e3))

### 🩹 Fixes

- Making api version property in bundled things to ease its discovery and usage when validating its compatibility ([aa81d087](https://github.com/LIT-Protocol/Vincent/commit/aa81d087))
- ### Implement supported Vincent Ability API range ([14f0ece1](https://github.com/LIT-Protocol/Vincent/commit/14f0ece1))

  Added basic Ability API handling to ensure abilities & policies are only used by compatible abilities and policies, and with the correct version of the vincentAbilityClient / app-sdk
  - Added a new jsParam when VincentAbilityClient calls an ability, `vincentAbilityApiVersion`
  - LIT action wrappers for abilities + policies compare `vincentAbilityApiVersion` to match the major semver range the handler was built with from the ability-sdk
  - vincentAbilityHandler() is responsible for passing along the value when it evaluates supported policies

### ⚠️ Breaking Changes

- Add support for vincent-contract-sdk using CBOR2 encoded policy parameters ([819fcd11](https://github.com/LIT-Protocol/Vincent/commit/819fcd11))
- ### `error` is now `runtimeError` and can only be set by `throw ...` ([04f1ca20](https://github.com/LIT-Protocol/Vincent/commit/04f1ca20))
  - Previously, if you had not defined a `deny` or `fail` schema, you could call `deny()` or `fail()` with a string
  - That string would end up in the ability/policy response as the `error` property instead of `result`
  - This was problematic because there was no consistent way to identify _un-handled_ error vs. _explicitly returned fail/deny results_
  - If you don't define a deny or fail schema, you can no longer call those methods with a string.
  - `error` is now `runtimeError`, and is _only_ set if a lifecycle method `throw`s an Error - in that case it will be the `message` property of the error
  - If you want to be able to return simple errors in your _result_, you can define a simple deny or fail schema like `z.object({ error: z.string() }`

- ### Add support for explicit `schemaValidationError` ([337a4bde](https://github.com/LIT-Protocol/Vincent/commit/337a4bde))
  - Previously, a failure to validate either input or results of lifecycle method would result in `result: { zodError }` being returned
  - Now, `result` will be `undefined` and there will be an explicit `schemaValidationError` in the result of the ability / policy

  ```typescript
  export interface SchemaValidationError {
    zodError: ZodError<unknown>; // The result of `zod.safeParse().error`
    phase: string; // Policies: `precheck`|`evaluate`|`commit` - Abilities: `precheck` | `execute`
    stage: string; // `input` | `output`
  }
  ```

### 🧱 Updated Dependencies

- Updated contracts-sdk to 2.0.0

### ❤️ Thank You

- Daryl Collins
- FedericoAmura @FedericoAmura

## 1.0.2 (2025-07-08)

### 🩹 Fixes

- - Correct type of `PolicyEvaluationResultContext.deniedPolicy` so that `error` is a sibling of `result` ([edc609f5](https://github.com/LIT-Protocol/Vincent/commit/edc609f5))
- - Fixed a case where a deny response from a policy could be returned without being parsed by its deny result schema ([27a35240](https://github.com/LIT-Protocol/Vincent/commit/27a35240))
- - Fixed incorrect handling of failure results that resulted in `success: true` responses from abilities that returned fail results ([51087e71](https://github.com/LIT-Protocol/Vincent/commit/51087e71))
- - Fixed `undefined` being returned to caller instead of the correct `error` string in cases where no fail result schema was defined and an explicit string was passed to `fail()` ([e8f1316a](https://github.com/LIT-Protocol/Vincent/commit/e8f1316a))
- - Fixed ability result typeguard functions incorrectly returning `false` when they were provided outputs with no `result` (e.g. no return value schema is defined for the lifecycle method) ([cf542969](https://github.com/LIT-Protocol/Vincent/commit/cf542969))

### ❤️ Thank You

- Daryl Collins
