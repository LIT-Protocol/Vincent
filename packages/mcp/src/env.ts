import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

// Ref: https://github.com/t3-oss/t3-env/pull/145
const booleanStrings = ['true', 'false', true, false, '1', '0', 'yes', 'no', 'y', 'n', 'on', 'off'];
const BooleanOrBooleanStringSchema = z
  .any()
  .refine((val) => booleanStrings.includes(val), { message: 'must be boolean' })
  .transform((val) => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
      const normalized = val.toLowerCase().trim();
      if (['true', 'yes', 'y', '1', 'on'].includes(normalized)) return true;
      if (['false', 'no', 'n', '0', 'off'].includes(normalized)) return false;
      throw new Error(`Invalid boolean string: "${val}"`);
    }
    throw new Error(`Expected boolean or boolean string, got: ${typeof val}`);
  });

const ONE_HOUR = 60 * 60 * 1000;

export const env = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
  server: {
    HTTP_PORT: z.coerce.number().default(3000),
    HTTP_TRANSPORT_CLEAN_INTERVAL: z.coerce.number().default(ONE_HOUR),
    HTTP_TRANSPORT_TTL: z.coerce.number().default(ONE_HOUR),
    PUBKEY_ROUTER_DATIL_CONTRACT: z.string(),
    VINCENT_APP_JSON_DEFINITION: z.string(),
    VINCENT_DELEGATEE_PRIVATE_KEY: z.string(),
    VINCENT_DATIL_CONTRACT: z.string(),
  },
});
