import {
  createVincentTool,
  createVincentToolPolicy,
  supportedPoliciesForTool,
} from '@lit-protocol/vincent-tool-sdk';
import { bundledVincentPolicy } from '@lit-protocol/vincent-policy-spending-limit';

import { CHAIN_TO_ADDRESSES_MAP } from '@uniswap/sdk-core';

import { getTokenAmountInUsd, sendUniswapTx } from './tool-helpers';
import {
  checkNativeTokenBalance,
  checkTokenInBalance,
  checkUniswapPoolExists,
} from './tool-checks';
import { executeSuccessSchema, toolParamsSchema } from './schemas';
import { ethers } from 'ethers';
import { checkErc20Allowance } from './tool-checks/check-erc20-allowance';

const SpendingLimitPolicy = createVincentToolPolicy({
  toolParamsSchema,
  bundledVincentPolicy,
  toolParameterMappings: {
    rpcUrlForUniswap: 'rpcUrlForUniswap',
    chainIdForUniswap: 'chainIdForUniswap',
    ethRpcUrl: 'ethRpcUrl',
    tokenInAddress: 'tokenAddress',
    tokenInDecimals: 'tokenDecimals',
    tokenInAmount: 'buyAmount',
  },
});

export const vincentTool = createVincentTool({
  packageName: '@lit-protocol/vincent-tool-uniswap-swap' as const,
  toolDescription: 'Performs a swap between two ERC20 tokens using Uniswap' as const,

  toolParamsSchema,
  supportedPolicies: supportedPoliciesForTool([SpendingLimitPolicy]),

  executeSuccessSchema,

  precheck: async ({ toolParams }, { fail, succeed, delegation: { delegatorPkpInfo } }) => {
    // TODO: The return types for this precheck could be more strongly typed; right now they will just be `error` with a string.
    const {
      rpcUrlForUniswap,
      chainIdForUniswap,
      tokenInAddress,
      tokenInDecimals,
      tokenInAmount,
      tokenOutAddress,
      tokenOutDecimals,
    } = toolParams;

    console.log('Prechecking UniswapSwapTool', toolParams);
    const delegatorPkpAddress = delegatorPkpInfo.ethAddress;

    const provider = new ethers.providers.JsonRpcProvider(rpcUrlForUniswap);

    await checkNativeTokenBalance({
      provider,
      pkpEthAddress: delegatorPkpAddress as `0x${string}`,
    });

    const uniswapRouterAddress = CHAIN_TO_ADDRESSES_MAP[
      chainIdForUniswap as keyof typeof CHAIN_TO_ADDRESSES_MAP
    ].swapRouter02Address as `0x${string}`;
    if (uniswapRouterAddress === undefined) {
      return fail(
        `Uniswap router address not found for chainId ${chainIdForUniswap} (UniswapSwapToolPrecheck)`,
      );
    }

    const requiredAmount = ethers.utils
      .parseUnits(tokenInAmount.toString(), tokenInDecimals)
      .toBigInt();

    await checkErc20Allowance({
      provider,
      tokenAddress: tokenInAddress as `0x${string}`,
      owner: delegatorPkpAddress as `0x${string}`,
      spender: uniswapRouterAddress,
      tokenAmount: requiredAmount,
    });

    await checkTokenInBalance({
      provider,
      pkpEthAddress: delegatorPkpAddress as `0x${string}`,
      tokenInAddress: tokenInAddress as `0x${string}`,
      tokenInAmount: requiredAmount,
    });

    await checkUniswapPoolExists({
      rpcUrl: rpcUrlForUniswap,
      chainId: chainIdForUniswap,
      tokenInAddress: tokenInAddress as `0x${string}`,
      tokenInDecimals,
      tokenInAmount,
      tokenOutAddress: tokenOutAddress as `0x${string}`,
      tokenOutDecimals,
    });

    return succeed();
  },
  execute: async (
    { toolParams },
    { succeed, fail, policiesContext, delegation: { delegatorPkpInfo } },
  ) => {
    console.log('Executing UniswapSwapTool', JSON.stringify(toolParams, null, 2));

    const { ethAddress: delegatorPkpAddress, publicKey: delegatorPublicKey } = delegatorPkpInfo;
    const {
      ethRpcUrl,
      rpcUrlForUniswap,
      chainIdForUniswap,
      tokenInAddress,
      tokenInDecimals,
      tokenInAmount,
      tokenOutAddress,
      tokenOutDecimals,
    } = toolParams;

    const spendingLimitPolicyContext =
      policiesContext.allowedPolicies['@lit-protocol/vincent-policy-spending-limit'];

    const swapTxHash = await sendUniswapTx({
      rpcUrl: rpcUrlForUniswap,
      chainId: chainIdForUniswap,
      pkpEthAddress: delegatorPkpAddress as `0x${string}`,
      pkpPublicKey: delegatorPublicKey,
      tokenInAddress: tokenInAddress as `0x${string}`,
      tokenOutAddress: tokenOutAddress as `0x${string}`,
      tokenInDecimals,
      tokenOutDecimals,
      tokenInAmount,
    });

    let spendTxHash: string | undefined;

    if (spendingLimitPolicyContext !== undefined) {
      const tokenInAmountInUsd = await getTokenAmountInUsd({
        ethRpcUrl,
        rpcUrlForUniswap,
        chainIdForUniswap,
        tokenAddress: tokenInAddress,
        tokenAmount: tokenInAmount,
        tokenDecimals: tokenInDecimals,
      });

      const { maxSpendingLimitInUsd } = spendingLimitPolicyContext.result;
      const commitResult = await spendingLimitPolicyContext.commit({
        amountSpentUsd: tokenInAmountInUsd.toNumber(),
        maxSpendingLimitInUsd,
      });

      console.log('Spending limit policy commit result', JSON.stringify(commitResult));
      if (commitResult.allow) {
        spendTxHash = commitResult.result.spendTxHash;
      } else {
        return fail(
          commitResult.error ?? 'Unknown error occurred while committing spending limit policy',
        );
      }
      console.log(
        `Committed spending limit policy for transaction: ${spendTxHash} (UniswapSwapToolExecute)`,
      );
    }

    return succeed({
      swapTxHash,
      spendTxHash,
    });
  },
});
