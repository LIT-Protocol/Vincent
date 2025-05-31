import { z } from 'zod';

// Default validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_URL: 'Please enter a valid URL',
  INVALID_PACKAGE_NAME: 'Package name must be in format @org/package',
  INVALID_WALLET_ADDRESS: 'Please enter a valid wallet address',
  INVALID_VERSION: 'Version must be in format X.X.X',
  INVALID_APP_ID: 'App ID must be a number',
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must be no more than ${max} characters`,
  NUMERIC_ONLY: 'Must be a number',
} as const;

// Common Zod schemas for validation
export const schemas = {
  required: (message?: string) => z.string().min(1, message || VALIDATION_MESSAGES.REQUIRED),
  email: (message?: string) => z.string().email(message || VALIDATION_MESSAGES.INVALID_EMAIL),
  url: (message?: string) => z.string().url(message || VALIDATION_MESSAGES.INVALID_URL),
  minLength: (length: number, message?: string) =>
    z.string().min(length, message || VALIDATION_MESSAGES.MIN_LENGTH(length)),
  maxLength: (length: number, message?: string) =>
    z.string().max(length, message || VALIDATION_MESSAGES.MAX_LENGTH(length)),
  numeric: (message?: string) =>
    z.string().regex(/^\d+$/, message || VALIDATION_MESSAGES.NUMERIC_ONLY),
  packageName: (message?: string) =>
    z
      .string()
      .regex(/^@[a-z0-9-]+\/[a-z0-9-]+$/, message || VALIDATION_MESSAGES.INVALID_PACKAGE_NAME),
  version: (message?: string) =>
    z.string().regex(/^\d+\.\d+\.\d+$/, message || VALIDATION_MESSAGES.INVALID_VERSION),
  walletAddress: (message?: string) =>
    z.string().regex(/^0x[a-fA-F0-9]{40}$/, message || VALIDATION_MESSAGES.INVALID_WALLET_ADDRESS),
  appId: (message?: string) =>
    z.string().regex(/^\d+$/, message || VALIDATION_MESSAGES.INVALID_APP_ID),
  optional: z.string().optional(),
  arrayOfStrings: (message?: string) =>
    z
      .array(z.string().min(1, 'Each item must not be empty'))
      .min(1, message || 'At least one item is required')
      .refine((arr) => arr.every((item) => item.trim() !== ''), {
        message: 'All items must be non-empty',
      }),
};

// Helper function to validate using Zod schemas
export const validateWithSchema = (schema: z.ZodSchema, value: any): string | undefined => {
  const result = schema.safeParse(value);
  if (!result.success) {
    return result.error.errors[0]?.message || 'Invalid value';
  }
  return undefined;
};

// Helper functions for creating validation rules (legacy support)
export const validationHelpers = {
  required: (message?: string) => ({
    required: true,
    message: message || VALIDATION_MESSAGES.REQUIRED,
  }),
  minLength: (length: number, message?: string) => ({
    required: true,
    minLength: length,
    message: message || VALIDATION_MESSAGES.MIN_LENGTH(length),
  }),
  pattern: (pattern: RegExp, message: string) => ({
    required: true,
    pattern,
    message,
  }),
};
