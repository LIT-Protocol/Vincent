import { z } from 'zod';

// Basic ability parameters schema used by all abilities
export const abilityParams = z.object({ x: z.string() });

// Success schema used by success abilities
export const SuccessSchema = z.object({ ok: z.boolean() });

// Failure schema used by failure abilities
export const FailSchema = z.object({ err: z.string() });

// Basic policy parameters schema used by all policies
export const policyParams = z.object({ y: z.string() });

// Allow schema used by allow policies
export const AllowSchema = z.object({ ok: z.boolean() });

// Deny schema used by deny policies
export const DenySchema = z.object({ reason: z.string() });
