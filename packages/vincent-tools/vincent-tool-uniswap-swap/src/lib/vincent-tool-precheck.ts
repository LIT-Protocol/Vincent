import { z } from 'zod';
import { ToolContext, PolicyEvaluationResultContext } from '@lit-protocol/vincent-tool-sdk';
import { SpendingLimitPolicyDef } from '@lit-protocol/vincent-policy-spending-limit';
import { createPublicClient, http } from 'viem';

import {
  UniswapSwapToolParamsSchema,
  UniswapSwapToolPrecheckSuccessSchema,
  UniswapSwapToolPrecheckFailSchema,
} from './vincent-tool';
import { checkEthBalance, checkTokenInBalance, checkUniswapPoolExists } from './tool-checks';
export const UniswapSwapToolPrecheck = async (
  {
    toolParams,
    policiesContext,
  }: {
    toolParams: z.infer<typeof UniswapSwapToolParamsSchema>;
    policiesContext: PolicyEvaluationResultContext<{
      '@lit-protocol/vincent-policy-spending-limit': {
        policyDef: typeof SpendingLimitPolicyDef;
      };
    }>;
  },
  context: ToolContext<
    typeof UniswapSwapToolPrecheckSuccessSchema,
    typeof UniswapSwapToolPrecheckFailSchema
  >,
) => {
  try {
    const {
      pkpEthAddress,
      ethRpcUrl,
      tokenInAddress,
      tokenInDecimals,
      tokenInAmount,
      tokenOutAddress,
      tokenOutDecimals,
    } = UniswapSwapToolParamsSchema.parse(toolParams);

    const client = createPublicClient({
      transport: http(ethRpcUrl),
    });

    await checkEthBalance({
      client,
      pkpEthAddress: pkpEthAddress as `0x${string}`,
    });

    await checkTokenInBalance({
      client,
      pkpEthAddress: pkpEthAddress as `0x${string}`,
      tokenInAddress: tokenInAddress as `0x${string}`,
      tokenInAmount,
    });

    await checkUniswapPoolExists({
      ethRpcUrl,
      tokenInAddress: tokenInAddress as `0x${string}`,
      tokenInDecimals,
      tokenInAmount,
      tokenOutAddress: tokenOutAddress as `0x${string}`,
      tokenOutDecimals,
    });

    // TODO Check tokenInAddress ERC20 Allowance for Uniswap Router Contract

    return context.succeed({
      allow: true,
    });
  } catch (error) {
    return context.fail({
      allow: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
