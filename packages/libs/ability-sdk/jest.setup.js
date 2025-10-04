import { config } from '@dotenvx/dotenvx';

if (!process.env['NX_LOAD_DOT_ENV_FILES']) {
  config({ path: __dirname + '/.env.test' });
}
