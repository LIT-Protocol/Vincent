# @lit-protocol/lit-action-bundler-rollup

A Rollup-based bundler for LIT Actions that targets LIT-compatible builds in the Deno-based LIT action sandbox environment.

## Overview

The `lit-action-bundler-rollup` package provides a specialized Rollup configuration for bundling TypeScript code into LIT Actions that can run in the LIT Protocol's Deno-based execution environment. It handles various compatibility issues and produces builds with IPFS CIDs.

## Features

- **Deno Compatibility**: Ensures your code works in the LIT Protocol's Deno-based sandbox
- **Node.js Built-ins Handling**: Automatically rewrites Node.js built-ins to use the `node:` prefix
- **Fetch API Compatibility**: Replaces references to `node-fetch` and `cross-fetch` with Deno-native implementation
- **TypeScript Support**: Compiles TypeScript code to JavaScript
- **Global Bindings**: Injects missing global bindings like `Buffer` and `crypto` so you don't need to
- **IPFS Integration**: Computes IPFS CIDs for bundled code
- **Metadata Generation**: Creates metadata JSON file containg the IPFS CID of bundled code, for tooling integration

## Installation

```bash
npm install @lit-protocol/lit-action-bundler-rollup --save-dev
# or
yarn add @lit-protocol/lit-action-bundler-rollup --dev
# or
pnpm add @lit-protocol/lit-action-bundler-rollup -D
```

## Usage

```typescript
import { getRollupConfig } from '@lit-protocol/lit-action-bundler-rollup';
import { rollup } from 'rollup';

// Create a Rollup configuration for bundling a LIT Action
const rollupConfig = getRollupConfig({
  // Function that returns the content of the LIT action handler
  getLitActionHandlerContent: () => `
    // Your LIT action handler code here
    const go = async () => {
      // Your code
    };
    go();
  `,
  // Directory where bundled files will be output
  outputDir: './generated',
  // Path to the source file to be bundled
  sourceFilePath: './src/myLitAction.ts',
  // Path to the TypeScript configuration file
  tsconfigPath: './tsconfig.json',
});

// Use the configuration with Rollup
async function build() {
  const bundle = await rollup(rollupConfig);
  await bundle.write(rollupConfig.output);
}

build().catch(console.error);
```

## Output Files

The bundler generates several output files in the outputDir you provide:

1. **[name].js**: The main bundled JavaScript file
2. **[name]-handler.ts**: The generated LIT action handler wrapper file
3. **[name].bundled.js**: The raw bundled code that is executed by LIT nodes
4. **[name]-metadata.json**: A metadata file containing the IPFS CID

## Plugin Order (internal)

The bundler uses a specific order of Rollup plugins to ensure correct bundling:

1. `createLitBundleContext()`: Creates shared context for plugins
2. `rewriteNodeBuiltinsToNodePrefix()`: Rewrites "crypto" to "node:crypto"
3. `generateLitActionHandler()`: Generates LIT action handler file
4. `alias()`: Redirects `node-fetch` / `cross-fetch` to Deno fetch
5. `typescript()`: Transpiles `.ts` to `.js`
6. `inject()`: Injects missing globals like `Buffer` and `crypto`
7. `writeBundledIIFECode()`: Wraps output in IIFE + computes IPFS hash
8. `emitMetadataFile()`: Emits metadata JSON file with IPFS CID

For more details on the plugin ordering strategy, see the [Plugin Order Guide](./src/lib/README.md).

## License

MIT
