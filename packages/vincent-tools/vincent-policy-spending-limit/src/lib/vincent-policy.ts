import { z } from 'zod';
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';

import { spendingLimitPolicyPrecheck } from './vincent-policy-precheck';
import { spendingLimitPolicyEval } from './vincent-policy-eval';
import { spendingLimitPolicyCommit } from './vincent-policy-commit';

export const spendingLimitPolicyToolParamsSchema = z.object({
  appId: z.number(),
  pkpEthAddress: z.string(),
  rpcUrl: z.string(),
  tokenAddress: z.string(),
  tokenDecimals: z.number(),
  buyAmount: z.number(),
});

export const spendingLimitPolicyUserParamsSchema = z.object({
  maxDailySpendAmountUsd: z.string(),
});

export const spendingLimitPolicyEvalAllowResultSchema = z.object({
  currentDailySpendAmountUsd: z.string(),
  maxDailySpendAmountUsd: z.string(),
});

export const spendingLimitPolicyEvalDenyResultSchema = z.object({
  reason: z.literal('Attempted buy amount exceeds daily limit'),
  attemptedBuyAmountUsd: z.string(),
  currentDailySpendAmountUsd: z.string(),
  maxDailySpendAmountUsd: z.string(),
});

export const spendingLimitPolicyPrecheckAllowResultSchema = z.object({
  currentDailySpendAmountUsd: z.string(),
  maxDailySpendAmountUsd: z.string(),
});

export const spendingLimitPolicyPrecheckDenyResultSchema = z.object({
  reason: z.literal('Attempted buy amount exceeds daily limit'),
  attemptedBuyAmountUsd: z.string(),
  currentDailySpendAmountUsd: z.string(),
  maxDailySpendAmountUsd: z.string(),
});

export const spendingLimitPolicyCommitParamsSchema = z.object({
  amountSpentUsd: z.number(),
});

export const spendingLimitPolicyCommitAllowResultSchema = z.object({
  transactionHash: z.string(),
});

export const spendingLimitPolicyCommitDenyResultSchema = z.object({
  transactionHash: z.string(),
});

export const spendingLimitPolicyDef = createVincentPolicy({
  // TODO: Replace with actual CID
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-policy-spending-limit',

  toolParamsSchema: spendingLimitPolicyToolParamsSchema,
  userParamsSchema: spendingLimitPolicyUserParamsSchema,

  evalAllowResultSchema: spendingLimitPolicyEvalAllowResultSchema,
  evalDenyResultSchema: spendingLimitPolicyEvalDenyResultSchema,

  commitParamsSchema: spendingLimitPolicyCommitParamsSchema,
  commitAllowResultSchema: spendingLimitPolicyCommitAllowResultSchema,
  commitDenyResultSchema: spendingLimitPolicyCommitDenyResultSchema,

  precheck: spendingLimitPolicyPrecheck,
  evaluate: spendingLimitPolicyEval,
  commit: spendingLimitPolicyCommit,
});
