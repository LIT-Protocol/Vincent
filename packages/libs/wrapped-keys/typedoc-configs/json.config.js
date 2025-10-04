// JSON output is what gets composed into the full docs generated in the repo root

// By only re-generating JSON output on NPM publish, we ensure that in-flux TSDocs in the SDK aren't
// published before we have pushed the code that those docs reference until it's live in NPM

const { OUT_DIR } = require('./vars');
const { join } = require('node:path');

module.exports = {
  outputs: [
    {
      name: 'json',
      path: join(OUT_DIR, 'json'),
    },
  ],
  extends: './base.config.js',
};
