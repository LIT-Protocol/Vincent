const { withNx } = require('@nx/rollup/with-nx');

module.exports = withNx(
  {
    compiler: 'swc',
    format: ['esm', 'cjs'],
    main: './src/index.ts',
    outputPath: './dist',
    tsConfig: './tsconfig.lib.json',
  },
  {
    // Provide additional rollup configuration here. See: https://rollupjs.org/configuration-options
    // e.g.
    // output: { sourcemap: true },
  },
);
