// Incrementally enforcing some stricter rules
const strictConfig = require('../../../eslint.config.strict.js');

module.exports = [
  ...strictConfig,
  {
    ignores: ['**/lib/**/*'],
  },
];
