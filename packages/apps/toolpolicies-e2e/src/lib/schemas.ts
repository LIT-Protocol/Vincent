import { z } from 'zod';

// Basic tool parameters schema used by all tools
export const toolParams = z.object({ x: z.string() });

// Success schema used by success tools
export const SuccessSchema = z.object({ ok: z.boolean() });

// Failure schema used by failure tools
export const FailSchema = z.object({ err: z.string() });

// Basic policy parameters schema used by all policies
export const policyParams = z.object({ y: z.string() });

// Allow schema used by allow policies
export const AllowSchema = z.object({ ok: z.boolean() });

// Deny schema used by deny policies
export const DenySchema = z.object({ reason: z.string() });
