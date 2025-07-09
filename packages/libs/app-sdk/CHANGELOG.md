## 1.0.2 (2025-07-08)

### 🩹 Fixes

- #### VincentToolClient Precheck fixes ([8da32df2](https://github.com/LIT-Protocol/Vincent/commit/8da32df2))

  - Fix a case where deny results from `precheck()` were not correctly bubbled to the caller
  - Fixed incorrect return type shape - `error` is a sibling of `result` in the policiesContext- Ensured `error` is bubbled up to the caller when provided

- - VincentToolClient - Expose correct policiesContext type when calling `precheck()` ([812d4fe9](https://github.com/LIT-Protocol/Vincent/commit/812d4fe9))
- - `VincentToolClient` - Fixed case where a tool without its own `precheck()` function would return `success` result even if a policy returned an `deny` result from its `precheck()` ([71380b89](https://github.com/LIT-Protocol/Vincent/commit/71380b89))
- - `VincentToolClient` - Fixed case where a fail response did not return the `error` or `result` response to the caller correctly ([30e32f1e](https://github.com/LIT-Protocol/Vincent/commit/30e32f1e))

### 🧱 Updated Dependencies

- Updated tool-sdk to 1.0.2

### ❤️ Thank You

- Daryl Collins

## 0.0.7 (2025-05-26)

### 🚀 Features

- improved mcp api doc ([0389014](https://github.com/LIT-Protocol/Vincent/commit/0389014))
- updated Vincent MCP documentation with its own section ([3457891](https://github.com/LIT-Protocol/Vincent/commit/3457891))
- add documentation ([f539eb5](https://github.com/LIT-Protocol/Vincent/commit/f539eb5))
- implementation of the vincent mcp server stdio and http runners using the app to mcp transformer in the sdk ([aa58c17](https://github.com/LIT-Protocol/Vincent/commit/aa58c17))
- implementation of the vincent app mcp wrapper ([02dd8ca](https://github.com/LIT-Protocol/Vincent/commit/02dd8ca))
- add release script to release SDK and its doc to npm and vercel ([eaccd5f](https://github.com/LIT-Protocol/Vincent/commit/eaccd5f))
- **docs:** change title, downgrade for plugin extras ([cdd62c0](https://github.com/LIT-Protocol/Vincent/commit/cdd62c0))
- use standard syntax for jwt validation errors and move validation to decoding step ([fefbbc6](https://github.com/LIT-Protocol/Vincent/commit/fefbbc6))
- deduplicate vincent data in decoded jwt and revert building config changes ([481d131](https://github.com/LIT-Protocol/Vincent/commit/481d131))
- change ts compiler config to increase compatibility surface and fix usage in DCA FE vite app ([027582d](https://github.com/LIT-Protocol/Vincent/commit/027582d))
- add authorized app and user info to jwt ([237f70d](https://github.com/LIT-Protocol/Vincent/commit/237f70d))
- **vincent-app-sdk:** add Express authentication helpers and update docs ([14a04b3](https://github.com/LIT-Protocol/Vincent/commit/14a04b3))
- **vincent-app-sdk:** Update README.md ([d052e18](https://github.com/LIT-Protocol/Vincent/commit/d052e18))
- **vincent-app-sdk:** Add sdk-docs TypeDocs to root of repo ([fb15599](https://github.com/LIT-Protocol/Vincent/commit/fb15599))
- **vincent-app-sdk:** Return both the original JWT string and the decoded JWT object from `decodeVincentLoginJWT()` - Also fixed inverted logic check for `isLoginUri()`, and converted to object params for `isLoginUri()` ([c2f3a19](https://github.com/LIT-Protocol/Vincent/commit/c2f3a19))
- **vincent-app-sdk:** Add `removeLoginJWTFromURI()` method to `VincentWebAppClient` ([17072f4](https://github.com/LIT-Protocol/Vincent/commit/17072f4))
- **vincent-app-sdk:** Replace `pkp/delegatee-sigs` with a `VincentToolClient` - Exposes a single method, `getVincentToolClient()`, which Vincent app developers will use to interact with Vincent Tool LIT actions - Fixes existing code that created new instances of LitNodeClient and connecting to them every time the tool is interacted with, using newly minted singleton module - Initial TSDoc configurations for exposing the tool client construction and usage under a 'Vincent Tools' category. ([2052ebe](https://github.com/LIT-Protocol/Vincent/commit/2052ebe))
- **vincent-app-sdk:** Define an internal module for managing a singleton instance of a LitNodeClient ([d297b0c](https://github.com/LIT-Protocol/Vincent/commit/d297b0c))
- update vincent sdk readme ([090614d](https://github.com/LIT-Protocol/Vincent/commit/090614d))
- added contracts class ([ef1851e](https://github.com/LIT-Protocol/Vincent/commit/ef1851e))

### 🩹 Fixes

- ZodSchemmaMap typo ([095f38e](https://github.com/LIT-Protocol/Vincent/commit/095f38e))
- doc reference ([b1450f8](https://github.com/LIT-Protocol/Vincent/commit/b1450f8))
- remove unnecessary type annotation ([c71eeac](https://github.com/LIT-Protocol/Vincent/commit/c71eeac))
- sdk nx project linting tool ([82dd819](https://github.com/LIT-Protocol/Vincent/commit/82dd819))
- **docs:** rename (remove API) ([a4b8e83](https://github.com/LIT-Protocol/Vincent/commit/a4b8e83))
- **docs:** formatting fixes, custom css for :::info ([6f2fcef](https://github.com/LIT-Protocol/Vincent/commit/6f2fcef))
- **vincent-app-sdk:** Fix import of `JWT_ERROR` to import from root of `did-jwt` package ([dd96111](https://github.com/LIT-Protocol/Vincent/commit/dd96111))
- do not export simple jwt manipulating functions. Consumers should use the sdk directly ([6e46eee](https://github.com/LIT-Protocol/Vincent/commit/6e46eee))
- **publish:** need to include 'dist' ([ecf38c3](https://github.com/LIT-Protocol/Vincent/commit/ecf38c3))
- **sdk:** package.json exports ([dd35563](https://github.com/LIT-Protocol/Vincent/commit/dd35563))
- no need types node ([af98c0e](https://github.com/LIT-Protocol/Vincent/commit/af98c0e))
- **build:** add missing tsconfig.lib.json ([ce47c23](https://github.com/LIT-Protocol/Vincent/commit/ce47c23))
- **jest:** enable `passWithNoTests` ([0f4ac57](https://github.com/LIT-Protocol/Vincent/commit/0f4ac57))
- lint and any ([c4fc2ab](https://github.com/LIT-Protocol/Vincent/commit/c4fc2ab))
- **deps:** correctly scope dependencies between global & individual packages ([b3fdb8c](https://github.com/LIT-Protocol/Vincent/commit/b3fdb8c))
- **build:** remove rollup and use default nx settings ([b3769df](https://github.com/LIT-Protocol/Vincent/commit/b3769df))
- minor changes ([0a70d4a](https://github.com/LIT-Protocol/Vincent/commit/0a70d4a))
- removed umd build ([6e532fa](https://github.com/LIT-Protocol/Vincent/commit/6e532fa))

### ❤️ Thank You

- Ansh Saxena @anshss
- Anson
- awisniew207 @awisniew207
- Daryl Collins
- FedericoAmura @FedericoAmura
