import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

import { env as baseEnv } from './base';

const FIVE_MIN = 5 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

const httpEnv = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
  server: {
    EXPECTED_AUDIENCE: z.string(),
    PORT: z.coerce.number().default(3000),
    HTTP_TRANSPORT_CLEAN_INTERVAL: z.coerce.number().default(ONE_HOUR),
    HTTP_TRANSPORT_TTL: z.coerce.number().default(ONE_HOUR),
    SIWE_EXPIRATION_TIME: z.coerce.number().default(ONE_HOUR),
    SIWE_NONCE_CLEAN_INTERVAL: z.coerce.number().default(ONE_HOUR),
    SIWE_NONCE_TTL: z.coerce.number().default(FIVE_MIN),
    VINCENT_MCP_BASE_URL: z.string(),
  },
});

export const env = Object.freeze({
  ...baseEnv,
  ...httpEnv,
});
