import { z } from 'zod';
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';

import { spendingLimitPolicyEval } from './vincent-policy-eval';
import { spendingLimitPolicyCommit } from './vincent-policy-commit';

export const spendingLimitPolicyToolParamsSchema = z.object({
  appId: z.number(),
  pkpEthAddress: z.string(),
  ethRpcUrl: z.string(),
  tokenAddress: z.string(),
  tokenDecimals: z.number(),
  buyAmount: z.bigint(),
});

export const spendingLimitPolicyUserParamsSchema = z.object({
  maxDailySpendAmountUsd: z.bigint(),
});

export const spendingLimitPolicyEvalAllowResultSchema = z.object({
  allow: z.literal(true),
});

export const spendingLimitPolicyEvalDenyResultSchema = z.object({
  allow: z.literal(false),
  reason: z.literal('Attempted buy amount exceeds daily limit'),
});

export const spendingLimitPolicyCommitParamsSchema = z.object({
  appId: z.number(),
  amountSpentUsd: z.number(),
  maxSpendingLimitInUsd: z.number(),
  pkpEthAddress: z.string(),
  pkpPubKey: z.string(),
});

export const spendingLimitPolicyCommitAllowResultSchema = z.object({
  transactionHash: z.string(),
});

export const spendingLimitPolicyCommitDenyResultSchema = z.object({
  error: z.string(),
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

  evaluate: spendingLimitPolicyEval,
  commit: spendingLimitPolicyCommit,
});
