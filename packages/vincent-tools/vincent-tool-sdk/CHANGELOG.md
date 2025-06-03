## 0.0.0-1 (2025-06-03)

### 🚀 Features

- **vincent-tool-sdk:** Final VincentToolClient implementation with wrapper types intact and inference tests ([b3bf5da](https://github.com/LIT-Protocol/Vincent/commit/b3bf5da))
- **vincent-tool-sdk:** ToolResponse -> ToolResult -- responses are wrapped results with policy context added. ([875ed3c](https://github.com/LIT-Protocol/Vincent/commit/875ed3c))
- **vincent-tool-sdk:** PoliciesByPackageName finalization, finish refactoring wrapper vincentToolHandler and VincentToolClient logic ([d3a3e52](https://github.com/LIT-Protocol/Vincent/commit/d3a3e52))
- **vincent-tool-sdk:** Initial cut of `BundledVincentPolicy`, with support in `createVincentToolPolicy()` ([4eb970a](https://github.com/LIT-Protocol/Vincent/commit/4eb970a))
- **vincent-tool-sdk:** Modifications based on Wyatt's initial implementation of tools + policy Pt3 - use context.delegator as pkpEthAddress - Use getPkpInfo where needed - pass context where the eth address was needed instead of pkpTokenId ([92d5174](https://github.com/LIT-Protocol/Vincent/commit/92d5174))
- **vincent-tool-sdk:** Modifications based on Wyatt's initial implementation of tools + policy Pt2 - Refactor policyContext -- explicit policyDefContext - Update LifecycleFunctions to differentiate between internal lifecycle functions and external one explicitly. - Move VincentPolicy into core types, and VincentPolicyDef into subdir that is internal since we won't be handling VincentPolicyDef externally anymore - Use VincentPolicy everywhere that it makes sense (which is everywhere except argument passed to `createVincentPolicy()`! ([64d3433](https://github.com/LIT-Protocol/Vincent/commit/64d3433))
- **vincent-tool-sdk:** Modifications based on Wyatt's initial implementation of tools + policy - Remove ipfsCid from the `def`s - Add explicit interface for `VincentPolicy` -- e.g. a wrapped VincentPolicyDef w/ its lifecycle methods validated and w/ correct baseContext types. - Update `createVincentToolPolicy` to take a `VincentPolicy` rather than a def. ([f18a68c](https://github.com/LIT-Protocol/Vincent/commit/f18a68c))
- **vincent-tool-sdk:** Initial cut of vincentToolClient in the tool sdk - We could import just the VincentToolClient from the vincent-tool-sdk and expose it in the main vincent-sdk - I am torn. Should it just live there? It's going to use a ton of code that is exported by it, so it is tightly coupled to it either way. :thinking: ([2cc8029](https://github.com/LIT-Protocol/Vincent/commit/2cc8029))
- **vincent-tool-sdk:** Finish internalizing zod parsing of params and results on tools - Initial scaffolding for vincentToolHandler logic ([711ce97](https://github.com/LIT-Protocol/Vincent/commit/711ce97))
- **vincent-tool-sdk:** Finish internalizing zod parsing of params and results on policies - Added stronger inference inside of `vincentPolicyHandler()` ([2886c6f](https://github.com/LIT-Protocol/Vincent/commit/2886c6f))
- **vincent-tool-sdk:** Define vincentPolicyHandler using policyCore code to call evaluate ([deddcd7](https://github.com/LIT-Protocol/Vincent/commit/deddcd7))
- **vincent-tool-sdk:** Introduce toolCore and flesh out logic - Introduce external result types for tool - Move toolContext management to its own file (mirror policy structure) - Define rough cut of helpers and sync structure with policies ([eadb9e4](https://github.com/LIT-Protocol/Vincent/commit/eadb9e4))
- **vincent-tool-sdk:** Add lifecycle method executors for policies. - evaluate and precheck are very similar; they validate toolParams and userParams inputs and the result - commit just validates the commitParams and result. - They always return PolicyDenyResults _or_ the parsed + validated result from the policyDef - PolicyResponseDeny can now contain a result with a zodError because parsing the input or output failed ([52d9c22](https://github.com/LIT-Protocol/Vincent/commit/52d9c22))
- **vincent-tool-sdk:** Export __vincentPolicyDef and __vincentToolDef for usage by consumers w/ type inference ([89bfd82](https://github.com/LIT-Protocol/Vincent/commit/89bfd82))
- **vincent-tool-sdk:** Ensure externally provided context for the tool is sane and safe ([92ceee9](https://github.com/LIT-Protocol/Vincent/commit/92ceee9))
- **vincent-tool-sdk:** Externally injected ToolContext support ([a9fdb08](https://github.com/LIT-Protocol/Vincent/commit/a9fdb08))
- **vincent-tool-sdk:** Initial cut of 'reference policy results by package instead of ipfs cid' ([48e76bd](https://github.com/LIT-Protocol/Vincent/commit/48e76bd))
- **vincent-tool-sdk:** Initial cut of separating creation of VincentPolicy from VincentToolPolicy ([7e8b0c4](https://github.com/LIT-Protocol/Vincent/commit/7e8b0c4))
- **vincent-tool-sdk:** Implement ToolExecutionResult and ToolExecutionResponse with context object ([170c53b](https://github.com/LIT-Protocol/Vincent/commit/170c53b))
- **vincent-tool-sdk:** Implement baseContext injection ([d5c67bb](https://github.com/LIT-Protocol/Vincent/commit/d5c67bb))
- **vincent-tool-sdk:** Fix inference of policy results ([b804494](https://github.com/LIT-Protocol/Vincent/commit/b804494))
- **vincent-tool-sdk:** Initial cut of `vincent-tool-sdk` package rename, with type enforcement for VincentPolicyDef and VincentToolDef, and validation helper functions ([4e4927f](https://github.com/LIT-Protocol/Vincent/commit/4e4927f))

### 🩹 Fixes

- **vincent-tool-sdk:** Type updates - Ensure bundledPolicy type threads literal ipfs CID - Stop exporting unique symbol from policyDef context types - Rename PolicyMapType for clarity - Update createVincentToolPolicy signature for correctness - Relocate toolContext types - Relocate toolDef types - Initial refactor of `createVincentTool()` to support an inject ToolPolicyMap - Removed __vincentToolDef from the return type - Initial cut of VincentTool type - Add ToolResult resultCreator functions - Add createPolicyMapFromToolPolicies function ([4d35912](https://github.com/LIT-Protocol/Vincent/commit/4d35912))
- **vincent-tool-sdk:** Fail fast if duplicate package names ([6efa69a](https://github.com/LIT-Protocol/Vincent/commit/6efa69a))
- **vincent-tool-sdk:** Fix inference on commit results when `allow` has been checked ([f97c44d](https://github.com/LIT-Protocol/Vincent/commit/f97c44d))

### ❤️ Thank You

- Daryl Collins