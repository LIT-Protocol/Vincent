import { z } from 'zod';
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';

import { spendingLimitPolicyPrecheck } from './vincent-policy-precheck';
import { spendingLimitPolicyEval } from './vincent-policy-eval';
import { spendingLimitPolicyCommit } from './vincent-policy-commit';

export const spendingLimitPolicyToolParamsSchema = z.object({
  pkpEthAddress: z.string(),
  rpcUrl: z.string(),
  chainId: z.string(),
  tokenInAddress: z.string(),
  tokenOutAddress: z.string(),
  tokenInAmount: z.string(),
  tokenInDecimals: z.string(),
  tokenOutDecimals: z.string(),
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
  // userParamsSchema,

  evalAllowResultSchema: spendingLimitPolicyEvalAllowResultSchema,
  evalDenyResultSchema: spendingLimitPolicyEvalDenyResultSchema,

  commitParamsSchema: spendingLimitPolicyCommitParamsSchema,
  commitAllowResultSchema: spendingLimitPolicyCommitAllowResultSchema,
  commitDenyResultSchema: spendingLimitPolicyCommitDenyResultSchema,

  precheck: spendingLimitPolicyPrecheck,
  evaluate: spendingLimitPolicyEval,
  commit: spendingLimitPolicyCommit,
});
