# 📦 Vincent Rollup Bundler Plugin Order Guide

This guide documents the correct plugin ordering strategy for the Vincent bundler, which targets deterministic LIT-compatible builds in Deno-based sandboxes.

---

## 🔁 Plugin Execution Model (Rollup)

- Plugins execute in **declaration order** for most hooks:

  - `resolveId`, `load`, `transform`, `buildStart`, etc.

- Plugins execute in **reverse order** for:
  - `generateBundle`, `renderChunk`, `writeBundle`

---

## ✅ Recommended Plugin Order

| Plugin                              | Description                                          | Reason for Order                                  |
| ----------------------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| `createLitBundleContext()`          | Creates shared context for plugins                   | Must run first to initialize shared state         |
| `rewriteNodeBuiltinsToNodePrefix()` | Rewrites "crypto" to "node:crypto"                   | Needed early to normalize bare node specifiers    |
| `generateLitActionHandler()`        | Generates LIT action handler file                    | Must run before emitted chunk is referenced       |
| `alias()`                           | Redirects `node-fetch` / `cross-fetch` to deno fetch | Needed before module resolution                   |
| `typescript()`                      | Transpiles `.ts` to `.js`                            | Needs all files resolved and generated beforehand |
| `inject()`                          | Injects missing globals like `Buffer` and `crypto`   | Needs JS output from TypeScript                   |
| `writeBundledIIFECode()`            | Wraps output in IIFE + computes IPFS hash            | Post-processing of final emitted chunk            |
| `emitMetadataFile()`                | Emits metadata JSON file with IPFS CID               | Requires final JS from wrap step                  |

---

## 🧱 Rationale

- Context setup with `createLitBundleContext()` must run **first** to initialize shared state.
- Handler generation with `generateLitActionHandler()` must run **before** resolution or TypeScript.
- Inject plugins like `inject()` must run **after** transpilation so globals are present in JS form.
- Output post-processing (e.g., `writeBundledIIFECode()`, `emitMetadataFile()`) must happen **last**, when Rollup emits final chunks.

---

## 🔧 Tips

- Always use `path.resolve()` inside `alias()` to ensure correct cross-platform behavior.
- Always use named chunk labels (e.g. `'lit-action-handler'`) to avoid fragile string matching.
- Use `onwarn` or logging inside plugin hooks (`this.warn(...)`) to trace execution during builds.
- ***
