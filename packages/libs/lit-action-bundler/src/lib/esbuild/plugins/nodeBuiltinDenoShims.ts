import type { Plugin } from 'esbuild';

import path from 'path';

// Path to the shims directory relative to this file
const SHIMS_DIR = '../../shims';

export function nodeBuiltinDenoShims(): Plugin {
  return {
    name: 'node-builtin-deno-shims',
    setup(build) {
      // Handle top-level modules
      build.onResolve(
        {
          filter:
            /^(node:)?(assert|async_hooks|console|constants|crypto|dgram|dns|events|http|http2|https|net|os|path|querystring|readline|stream|string_decoder|timers|url|util|zlib)$/,
        },
        (args) => {
          const moduleName = args.path.replace(/^node:/, '');
          const shimPath = path.resolve(__dirname, path.join(SHIMS_DIR, `${moduleName}.js`));
          return { path: shimPath };
        },
      );

      // Handle stream submodules
      build.onResolve(
        { filter: /^(node:)?_stream_(duplex|passthrough|readable|transform|writable)$/ },
        (args) => {
          const moduleName = args.path.replace(/^node:/, '');
          const shimPath = path.resolve(__dirname, path.join(SHIMS_DIR, `${moduleName}.js`));
          return { path: shimPath };
        },
      );

      // Handle path submodules
      build.onResolve({ filter: /^(node:)?path\/(posix|win32)$/ }, (args) => {
        const modulePath = args.path.replace(/^node:/, '');
        const shimPath = path.resolve(__dirname, path.join(SHIMS_DIR, `${modulePath}.js`));
        return { path: shimPath };
      });

      // Handle assert submodules
      build.onResolve({ filter: /^(node:)?assert\/(strict)$/ }, (args) => {
        const modulePath = args.path.replace(/^node:/, '');
        const shimPath = path.resolve(__dirname, path.join(SHIMS_DIR, `${modulePath}.js`));
        return { path: shimPath };
      });

      // Handle readline submodules
      build.onResolve({ filter: /^(node:)?readline\/(promises)$/ }, (args) => {
        const modulePath = args.path.replace(/^node:/, '');
        const shimPath = path.resolve(__dirname, path.join(SHIMS_DIR, `${modulePath}.js`));
        return { path: shimPath };
      });

      // Handle stream submodules
      build.onResolve({ filter: /^(node:)?stream\/(consumers|promises|web)$/ }, (args) => {
        const modulePath = args.path.replace(/^node:/, '');
        const shimPath = path.resolve(__dirname, path.join(SHIMS_DIR, `${modulePath}.js`));
        return { path: shimPath };
      });

      // Handle timers submodules
      build.onResolve({ filter: /^(node:)?timers\/(promises)$/ }, (args) => {
        const modulePath = args.path.replace(/^node:/, '');
        const shimPath = path.resolve(__dirname, path.join(SHIMS_DIR, `${modulePath}.js`));
        return { path: shimPath };
      });

      // Handle dns submodules
      build.onResolve({ filter: /^(node:)?dns\/(promises)$/ }, (args) => {
        const modulePath = args.path.replace(/^node:/, '');
        const shimPath = path.resolve(__dirname, path.join(SHIMS_DIR, `${modulePath}.js`));
        return { path: shimPath };
      });

      // Handle util submodules
      build.onResolve({ filter: /^(node:)?util\/(types)$/ }, (args) => {
        const modulePath = args.path.replace(/^node:/, '');
        const shimPath = path.resolve(__dirname, path.join(SHIMS_DIR, `${modulePath}.js`));
        return { path: shimPath };
      });
    },
  };
}
