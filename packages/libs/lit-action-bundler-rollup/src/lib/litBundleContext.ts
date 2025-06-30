// src/lib/litBundleContext.ts

import type { PluginContext } from 'rollup';

export interface LitBundleContext {
  chunkFileNames: Record<string, string>;
  chunkIds: Record<string, string>;
}

export const litBundleCtxSymbol: unique symbol = Symbol('lit-bundler-context');

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Retrieves the shared bundler context. Should be called inside a Rollup plugin hook (e.g.
 * buildStart, generateBundle).
 */
export function getLitBundleContext(rollupPluginContext: PluginContext): LitBundleContext {
  const ctx = (rollupPluginContext as any)[litBundleCtxSymbol];
  if (!ctx) {
    throw new Error(
      '[LIT bundler] Shared context not initialized. Did you forget to include createLitBundleContext() early in the plugin array?',
    );
  }

  return ctx as LitBundleContext;
}

/**
 * Initializes the shared bundler context if it doesn't exist yet. Should be called in
 * `buildStart()` of a setup plugin.
 */
export function initLitBundleContext(rollupPluginContext: PluginContext): LitBundleContext {
  if (!(litBundleCtxSymbol in rollupPluginContext)) {
    (rollupPluginContext as any)[litBundleCtxSymbol] = {
      chunkFileNames: {},
      chunkIds: {},
    } satisfies LitBundleContext;
  }

  return (rollupPluginContext as any)[litBundleCtxSymbol] as LitBundleContext;
}
