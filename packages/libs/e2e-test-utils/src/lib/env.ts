import type { ZodRawShape } from 'zod';

import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

// Ref: https://github.com/t3-oss/t3-env/pull/145
const booleanStrings = ['true', 'false', true, false, '1', '0', 'yes', 'no', 'y', 'n', 'on', 'off'];
// @ts-expect-error Currently not using any boolean env vars, but keeping this for the future
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

const baseEnvSchema = {
  TEST_FUNDER_PRIVATE_KEY: z.string(),
  TEST_APP_MANAGER_PRIVATE_KEY: z.string(),
  TEST_APP_DELEGATEE_PRIVATE_KEY: z.string(),
  TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY: z.string(),
  YELLOWSTONE_RPC_URL: z.string().optional().default('https://yellowstone-rpc.litprotocol.com/'),
  // Smart Account (optional - only needed when enableSmartAccount=true)
  SMART_ACCOUNT_CHAIN_ID: z.string().optional(),
  ALCHEMY_RPC_URL: z.string().optional(),
  // ZeroDev
  ZERODEV_RPC_URL: z.string().optional(),
  // Crossmint
  CROSSMINT_API_KEY: z.string().optional(),
  // Safe
  SAFE_RPC_URL: z.string().optional(),
  PIMLICO_RPC_URL: z.string().optional(),
};

type InferEnvType<T extends ZodRawShape> = z.infer<z.ZodObject<T>>;

export const getEnv = <T extends ZodRawShape = typeof baseEnvSchema>(additionalSchema?: T) => {
  try {
    const schema = additionalSchema ? { ...baseEnvSchema, ...additionalSchema } : baseEnvSchema;

    return createEnv({
      emptyStringAsUndefined: true,
      runtimeEnv: process.env,
      server: schema,
    }) as InferEnvType<typeof baseEnvSchema> & InferEnvType<T>;
  } catch (e) {
    console.error('Failed to load all required environment variables!');
    throw e;
  }
};
