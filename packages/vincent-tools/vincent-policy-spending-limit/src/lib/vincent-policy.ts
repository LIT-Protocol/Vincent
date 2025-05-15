import { z } from 'zod';
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';

import { SpendingLimitPolicyEval } from './vincent-policy-eval';
import { SpendingLimitPolicyCommit } from './vincent-policy-commit';

export const SpendingLimitPolicyToolParamsSchema = z.object({
  appId: z.number(),
  pkpEthAddress: z.string(),
  ethRpcUrl: z.string(),
  tokenAddress: z.string(),
  tokenDecimals: z.number(),
  buyAmount: z.bigint(),
});

export const SpendingLimitPolicyUserParamsSchema = z.object({
  maxDailySpendAmountUsd: z.bigint(),
});

export const SpendingLimitPolicyEvalAllowResultSchema = z.object({
  allow: z.literal(true),
  appId: z.number(),
  maxSpendingLimitInUsd: z.bigint(),
});

export const SpendingLimitPolicyEvalDenyResultSchema = z.object({
  allow: z.literal(false),
  reason: z.literal('Attempted buy amount exceeds daily limit'),
});

export const SpendingLimitPolicyCommitParamsSchema = z.object({
  appId: z.number(),
  amountSpentUsd: z.number(),
  maxSpendingLimitInUsd: z.number(),
  pkpEthAddress: z.string(),
  pkpPubKey: z.string(),
});

export const SpendingLimitPolicyCommitAllowResultSchema = z.object({
  spendTxHash: z.string(),
});

export const SpendingLimitPolicyCommitDenyResultSchema = z.object({
  error: z.string(),
});

export const SpendingLimitPolicyDef = createVincentPolicy({
  // TODO: Replace with actual CID
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-policy-spending-limit',

  toolParamsSchema: SpendingLimitPolicyToolParamsSchema,
  userParamsSchema: SpendingLimitPolicyUserParamsSchema,

  evalAllowResultSchema: SpendingLimitPolicyEvalAllowResultSchema,
  evalDenyResultSchema: SpendingLimitPolicyEvalDenyResultSchema,

  commitParamsSchema: SpendingLimitPolicyCommitParamsSchema,
  commitAllowResultSchema: SpendingLimitPolicyCommitAllowResultSchema,
  commitDenyResultSchema: SpendingLimitPolicyCommitDenyResultSchema,

  evaluate: SpendingLimitPolicyEval,
  commit: SpendingLimitPolicyCommit,
});
