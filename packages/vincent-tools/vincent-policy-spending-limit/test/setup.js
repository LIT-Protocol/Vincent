const { config } = require('@dotenvx/dotenvx');

// Load environment variables from .env.test
config({ path: '.env.test' });
