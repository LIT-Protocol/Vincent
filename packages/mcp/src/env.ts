import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

// Ref: https://github.com/t3-oss/t3-env/pull/145
const booleanStrings = ['true', 'false', true, false, '1', '0', 'yes', 'no', 'y', 'n', 'on', 'off'];

// @ts-expect-error Just happen to not have any boolean env vars right now, but want to keep this in case we do
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

export const env = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
  server: {
    HTTP_PORT: z.coerce.number().default(3000),
    PUBKEY_ROUTER_DATIL_CONTRACT: z.string(),
    VINCENT_APP_JSON_DEFINITION: z.string(),
    VINCENT_DELEGATEE_PRIVATE_KEY: z.string(),
    VINCENT_DATIL_CONTRACT: z.string(),
  },
});
