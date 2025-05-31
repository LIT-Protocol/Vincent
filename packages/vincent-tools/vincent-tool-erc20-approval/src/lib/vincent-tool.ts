import { z } from 'zod';
import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
import { createPolicyMapFromToolPolicies } from '@lit-protocol/vincent-tool-sdk/src/lib/toolCore/helpers';
import { createPublicClient, http, parseUnits } from 'viem';

import { getPkpInfo, sendErc20ApprovalTx, getCurrentAllowance } from './tool-helpers';
import { checkNativeTokenBalance } from './tool-checks';

export const Erc20ApprovalToolParamsSchema = z.object({
  rpcUrl: z.string(),
  chainId: z.number(),
  pkpEthAddress: z.string(),
  spenderAddress: z.string(),

  tokenAddress: z.string(),
  tokenDecimals: z.number(),
  tokenAmount: z.number().refine((val) => val > 0, {
    message: 'tokenAmount must be greater than 0',
  }),
});

export const Erc20ApprovalToolPrecheckSuccessSchema = z.object({
  allow: z.literal(true),
  existingApprovalSufficient: z.boolean(),
});

export const Erc20ApprovalToolPrecheckFailSchema = z.object({
  allow: z.literal(false),
  error: z.string(),
});

export const Erc20ApprovalToolExecuteSuccessSchema = z.object({
  // Whether the existing approval amount is sufficient for the requested amount
  existingApprovalSufficient: z.boolean(),
  // Transaction hash if a new approval was created, undefined if existing approval was used
  approvalTxHash: z.string().optional(),
  // The approved amount that is now active (either from existing or new approval)
  approvedAmount: z.string(),
  // The spender address that was approved
  spenderAddress: z.string(),
});

export const Erc20ApprovalToolExecuteFailSchema = z.object({
  error: z.string(),
});

export const Erc20ApprovalToolDef = createVincentTool({
  // packageName: '@lit-protocol/vincent-tool-erc20-approval' as const,

  toolParamsSchema: Erc20ApprovalToolParamsSchema,
  policyMap: createPolicyMapFromToolPolicies([]),

  precheckSuccessSchema: Erc20ApprovalToolPrecheckSuccessSchema,
  precheckFailSchema: Erc20ApprovalToolPrecheckFailSchema,

  executeSuccessSchema: Erc20ApprovalToolExecuteSuccessSchema,
  executeFailSchema: Erc20ApprovalToolExecuteFailSchema,

  precheck: async ({ toolParams }, { policiesContext, fail, succeed }) => {
    if (!policiesContext.allow) return fail({ allow: false, error: 'Policy check failed' });

    const { rpcUrl, pkpEthAddress, spenderAddress, tokenAddress, tokenDecimals, tokenAmount } =
      toolParams;

    const client = createPublicClient({
      transport: http(rpcUrl),
    });

    await checkNativeTokenBalance({
      client,
      pkpEthAddress: pkpEthAddress as `0x${string}`,
    });

    const currentAllowance = await getCurrentAllowance({
      client,
      tokenAddress: tokenAddress as `0x${string}`,
      owner: pkpEthAddress as `0x${string}`,
      spender: spenderAddress as `0x${string}`,
    });

    const requiredAmount = parseUnits(tokenAmount.toString(), tokenDecimals);

    return succeed({
      allow: true,
      existingApprovalSufficient: currentAllowance >= requiredAmount,
    });
  },
  execute: async ({ toolParams }, { succeed, fail, policiesContext }) => {
    if (!policiesContext.allow) return fail({ error: 'Policy check failed' });

    console.log('Executing ERC20 Approval Tool');

    const {
      rpcUrl,
      chainId,
      pkpEthAddress,
      spenderAddress,
      tokenAddress,
      tokenDecimals,
      tokenAmount,
    } = toolParams;

    const pkpInfo = await getPkpInfo({
      pkpEthAddress: pkpEthAddress as `0x${string}`,
    });

    const client = createPublicClient({
      transport: http(rpcUrl),
    });

    await checkNativeTokenBalance({
      client,
      pkpEthAddress: pkpEthAddress as `0x${string}`,
    });

    const currentAllowance = await getCurrentAllowance({
      client,
      tokenAddress: tokenAddress as `0x${string}`,
      owner: pkpEthAddress as `0x${string}`,
      spender: spenderAddress as `0x${string}`,
    });

    const requiredAmount = parseUnits(tokenAmount.toString(), tokenDecimals);

    if (currentAllowance >= requiredAmount) {
      return succeed({
        existingApprovalSufficient: true,
        approvedAmount: currentAllowance.toString(),
        spenderAddress,
      });
    }

    const approvalTxHash = await sendErc20ApprovalTx({
      rpcUrl,
      chainId,
      pkpEthAddress: pkpEthAddress as `0x${string}`,
      pkpPublicKey: pkpInfo.publicKey,
      spenderAddress: spenderAddress as `0x${string}`,
      tokenAmount: BigInt(tokenAmount),
      tokenDecimals,
      tokenAddress: tokenAddress as `0x${string}`,
    });

    return succeed({
      existingApprovalSufficient: false,
      approvalTxHash,
      approvedAmount: requiredAmount.toString(),
      spenderAddress,
    });
  },
});
