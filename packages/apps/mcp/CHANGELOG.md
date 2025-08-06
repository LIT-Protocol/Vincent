## 1.0.0-0 (2025-08-05)

### ⚠️ Breaking Changes

- #### Update imports from `app-sdk` to use sub-paths, and resolve data type inconsistency (appId and appVersion are numbers now) ([b94ca569](https://github.com/LIT-Protocol/Vincent/commit/b94ca569))

  - Updated Typedoc structure to show each sub-path as its own category; removed package-wise catch-all 'Interfaces'

### 🧱 Updated Dependencies

- Updated app-sdk to 2.0.0
- Updated mcp-sdk to 1.0.0-0

### ❤️ Thank You

- Daryl Collins

## 0.0.2-0 (2025-07-08)

### 🩹 Fixes

- - Prerelease due to dependencies being published w/ new versions ([5b3b87bf](https://github.com/LIT-Protocol/Vincent/commit/5b3b87bf))

### 🧱 Updated Dependencies

- Updated app-sdk to 1.0.2
- Updated mcp-sdk to 0.0.2-0

### ❤️ Thank You

- Daryl Collins

## 0.0.3 (2025-05-27)

### 🚀 Features

- expand definition of delegatee private key env variable ([20560ba](https://github.com/LIT-Protocol/Vincent/commit/20560ba))
- updated Vincent MCP documentation with its own section ([3457891](https://github.com/LIT-Protocol/Vincent/commit/3457891))
- redirect console.log in stdio transport mode to console.error ensuring protocol is not polluted and does not break communication with client ([dac9d32](https://github.com/LIT-Protocol/Vincent/commit/dac9d32))
- add npx commands to run the server without needing to download the repository ([b007f96](https://github.com/LIT-Protocol/Vincent/commit/b007f96))
- update gitignore ([fda5c5c](https://github.com/LIT-Protocol/Vincent/commit/fda5c5c))
- add documentation in mcp readme file ([ce9b21d](https://github.com/LIT-Protocol/Vincent/commit/ce9b21d))
- add documentation ([f539eb5](https://github.com/LIT-Protocol/Vincent/commit/f539eb5))
- implementation of the vincent mcp server stdio and http runners using the app to mcp transformer in the sdk ([aa58c17](https://github.com/LIT-Protocol/Vincent/commit/aa58c17))

### 🩹 Fixes

- mcp package publishing ([30ce9c9](https://github.com/LIT-Protocol/Vincent/commit/30ce9c9))

### 🧱 Updated Dependencies

- Updated vincent-sdk to 0.0.7

### ❤️ Thank You

- FedericoAmura @FedericoAmura
