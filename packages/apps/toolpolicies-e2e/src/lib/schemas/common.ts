import { z } from 'zod';

// Basic tool parameters schema used by all tools
export const toolParams = z.object({ x: z.string() });

// Success schema used by success tools
export const SuccessSchema = z.object({ ok: z.boolean() });

// Failure schema used by failure tools
export const FailSchema = z.object({ err: z.string() });
