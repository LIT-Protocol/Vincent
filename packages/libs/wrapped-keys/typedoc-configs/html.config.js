// HTML output is only used for checking changes and watch mode inside this package; JSON output
// is what the docs actually publish from, in the root of the repo.

const { OUT_DIR } = require('./vars');
const { join } = require('node:path');

module.exports = {
  out: join(OUT_DIR, 'html'), // This has to be set, or customCss.css doesn't get copied
  outputs: [
    {
      name: 'html',
      path: join(OUT_DIR, 'html'),
    },
  ],
  extends: './base.config.js',
};
