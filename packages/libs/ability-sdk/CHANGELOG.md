## 1.0.2 (2025-07-08)

### 🩹 Fixes

- - Correct type of `PolicyEvaluationResultContext.deniedPolicy` so that `error` is a sibling of `result` ([edc609f5](https://github.com/LIT-Protocol/Vincent/commit/edc609f5))
- - Fixed a case where a deny response from a policy could be returned without being parsed by its deny result schema ([27a35240](https://github.com/LIT-Protocol/Vincent/commit/27a35240))
- - Fixed incorrect handling of failure results that resulted in `success: true` responses from abilities that returned fail results ([51087e71](https://github.com/LIT-Protocol/Vincent/commit/51087e71))
- - Fixed `undefined` being returned to caller instead of the correct `error` string in cases where no fail result schema was defined and an explicit string was passed to `fail()` ([e8f1316a](https://github.com/LIT-Protocol/Vincent/commit/e8f1316a))
- - Fixed ability result typeguard functions incorrectly returning `false` when they were provided outputs with no `result` (e.g. no return value schema is defined for the lifecycle method) ([cf542969](https://github.com/LIT-Protocol/Vincent/commit/cf542969))

### ❤️ Thank You

- Daryl Collins
