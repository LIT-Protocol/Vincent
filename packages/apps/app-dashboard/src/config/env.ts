import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

// Ref: https://github.com/t3-oss/t3-env/pull/145
// const booleanStrings = ['true', 'false', true, false, '1', '0', 'yes', 'no', 'y', 'n', 'on', 'off'];
// const BooleanOrBooleanStringSchema = z
//   .any()
//   .refine((val) => booleanStrings.includes(val), { message: 'must be boolean' })
//   .transform((val) => {
//     if (typeof val === 'boolean') return val;
//     if (typeof val === 'string') {
//       const normalized = val.toLowerCase().trim();
//       if (['true', 'yes', 'y', '1', 'on'].includes(normalized)) return true;
//       if (['false', 'no', 'n', '0', 'off'].includes(normalized)) return false;
//       throw new Error(`Invalid boolean string: "${val}"`);
//     }
//     throw new Error(`Expected boolean or boolean string, got: ${typeof val}`);
//   });

export const env = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: import.meta.env,
  clientPrefix: 'VITE_',
  client: {
    VITE_VINCENT_DATIL_CONTRACT: z.string(),
    VITE_DATIL_PKP_CONTRACT: z.string(),
    VITE_STYTCH_PUBLIC_TOKEN: z.string(),
    VITE_STYTCH_PROJECT_ID: z.string(),
    VITE_WALLETCONNECT_PROJECT_ID: z.string(),
    VITE_LIT_PAYER_SECRET_KEY: z.string(),
    VITE_LIT_RELAY_API_KEY: z.string(),
    VITE_VINCENT_YELLOWSTONE_RPC: z.string().url(),
    VITE_JWT_EXPIRATION_MINUTES: z.coerce.number(),
    VITE_GAS_BUFFER_DIVISOR: z.coerce.number(),
    VITE_DOMAIN: z.string().optional(),
    VITE_ENV: z.enum(['development', 'staging', 'production']).default('staging').optional(),
    VITE_VINCENT_YIELD_APPID: z.coerce.number(),
    VITE_DASHBOARD_URL: z.string(),
    VITE_VINCENT_YIELD_MINIMUM_DEPOSIT: z.coerce.number().default(50),
  },
});
