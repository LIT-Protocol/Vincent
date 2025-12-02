import { type Address, type Hex, isAddress, isHex } from 'viem';
import { z } from 'zod';

export const addressSchema = z
  .string()
  .refine((v): v is Address => isAddress(v, { strict: false }), {
    message: 'Invalid Ethereum address',
  });

export const hexSchema = z.custom<Hex>((v) => typeof v === 'string' && isHex(v, { strict: true }), {
  message: 'Invalid hex (must be 0x-prefixed, even length)',
});
