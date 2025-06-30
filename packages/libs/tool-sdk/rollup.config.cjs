const { withNx } = require('@nx/rollup/with-nx');
const { resolve } = require('path');

module.exports = withNx(
  {
    compiler: 'swc',
    format: ['esm', 'cjs'],
    main: './src/index.ts',
    additionalEntryPoints: ['./src/internal.ts'],
    outputPath: './dist',
    tsConfig: resolve('./tsconfig.lib.json'),
  },
  {
    // Provide additional rollup configuration here. See: https://rollupjs.org/configuration-options
    // e.g.
    // output: { sourcemap: true },
  },
);
