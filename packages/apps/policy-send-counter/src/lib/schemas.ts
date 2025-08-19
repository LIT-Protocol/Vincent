import { z } from 'zod';

/**
 * Ability parameters schema - matches the ability this policy works with
 */
export const abilityParamsSchema = z.object({
  to: z
    .string()
    .min(1, 'Recipient address cannot be empty')
    .describe("The recipient's address the underlying ability will send to."),
  amount: z
    .string()
    .min(1, 'Amount cannot be empty')
    .describe('The amount to send as a string (units/format depend on the underlying ability).'),
});

/**
 * User parameters schema - policy configuration set by the user
 */
export const userParamsSchema = z.object({
  maxSends: z
    .number()
    .positive()
    .describe('Maximum number of sends allowed within the configured time window.'),
  timeWindowSeconds: z
    .number()
    .positive()
    .describe('Length of the counting window in seconds (e.g., 10 = 10 seconds).'),
});

/**
 * Commit parameters schema - data passed to commit phase
 */
export const commitParamsSchema = z.object({
  currentCount: z
    .number()
    .describe('The number of sends recorded in the current time window at commit time.'),
  maxSends: z.number().describe('The maximum number of sends allowed in the time window.'),
  remainingSends: z.number().describe('How many sends remain available in the current window.'),
  timeWindowSeconds: z.number().describe('The duration of the time window in seconds.'),
});

/**
 * Precheck allow result schema
 */
export const precheckAllowResultSchema = z.object({
  currentCount: z.number().describe('The number of sends already made in the current window.'),
  maxSends: z.number().describe('The maximum number of sends allowed in the current window.'),
  remainingSends: z.number().describe('How many sends are still allowed before hitting the limit.'),
  timeWindowSeconds: z.number().describe('The duration of the time window in seconds.'),
});

/**
 * Precheck deny result schema
 */
export const precheckDenyResultSchema = z.object({
  reason: z.string().describe('The reason for denying the precheck.'),
  currentCount: z.number().describe('The number of sends already made in the current window.'),
  maxSends: z.number().describe('The maximum number of sends allowed in the current window.'),
  secondsUntilReset: z.number().describe('Number of seconds remaining until the counter resets.'),
});

/**
 * Evaluate allow result schema
 */
export const evalAllowResultSchema = z.object({
  currentCount: z.number().describe('The number of sends already made in the current window.'),
  maxSends: z.number().describe('The maximum number of sends allowed in the current window.'),
  remainingSends: z.number().describe('How many sends are still allowed before hitting the limit.'),
  timeWindowSeconds: z.number().describe('The duration of the time window in seconds.'),
});

/**
 * Evaluate deny result schema
 */
export const evalDenyResultSchema = z.object({
  reason: z.string().describe('The reason for denying the evaluation.'),
  currentCount: z.number().describe('The number of sends already made in the current window.'),
  maxSends: z.number().describe('The maximum number of sends allowed in the current window.'),
  secondsUntilReset: z.number().describe('Number of seconds remaining until the counter resets.'),
  timeWindowSeconds: z.number().describe('The duration of the time window in seconds.'),
});

/**
 * Commit allow result schema
 */
export const commitAllowResultSchema = z.object({
  recorded: z.boolean().describe('Whether the send was recorded in the policy state.'),
  newCount: z.number().describe('The updated number of sends recorded after this commit.'),
  remainingSends: z
    .number()
    .describe('How many sends remain available in the current window after commit.'),
});

/**
 * Commit deny result schema (though commit rarely denies)
 */
export const commitDenyResultSchema = z.object({
  reason: z.string().describe('A string containing the error message if the commit failed.'),
});
