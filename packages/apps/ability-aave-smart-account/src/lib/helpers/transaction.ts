import { z } from 'zod';

import { addressSchema, hexSchema } from './schemas';

export const transactionSchema = z.object({
  data: hexSchema,
  from: addressSchema,
  to: addressSchema,
  value: hexSchema,
});

export type Transaction = z.infer<typeof transactionSchema>;
