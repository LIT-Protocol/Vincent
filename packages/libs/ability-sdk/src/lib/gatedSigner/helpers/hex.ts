import type { Address, Hex } from 'viem';

import { isAddress, isHex } from 'viem';
import { z } from 'zod';

export const addressSchema = z
  .string()
  .refine((v): v is Address => isAddress(v, { strict: false }), {
    message: 'Invalid Ethereum address',
  });

export const hexSchema = z.custom<Hex>((v) => typeof v === 'string' && isHex(v, { strict: true }), {
  message: 'Invalid hex (must be 0x-prefixed, even length)',
});

export const hexOfBytesSchema = (bytes: number) =>
  z.custom<Hex>(
    (v) => typeof v === 'string' && isHex(v, { strict: true }) && (v.length - 2) / 2 === bytes,
    { message: `Invalid hex (must be 0x + ${bytes} bytes)` },
  );
