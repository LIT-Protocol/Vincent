import { config } from '@dotenvx/dotenvx';
import path from 'path';

// This is a shim for running jest tests w/ env injection, directly from VSCode or Webstorm
if (!process.env['NX_LOAD_DOT_ENV_FILES']) {
  config({ path: path.join(__dirname, '../.env.test') });
}
