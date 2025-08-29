import {
  createVincentAbility,
  createVincentAbilityPolicy,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { bundledVincentPolicy } from '@lit-protocol/vincent-policy-spending-limit';

import { getTokenAmountInUsd, sendUniswapTxWithRoute, getUniswapQuote } from './ability-helpers';
import {
  checkNativeTokenBalance,
  checkTokenInBalance,
  validateUniswapRoute,
} from './ability-checks';
import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  precheckSuccessSchema,
  abilityParamsSchema,
} from './schemas';
import { ethers } from 'ethers';
import { checkErc20Allowance } from './ability-checks/check-erc20-allowance';

const SpendingLimitPolicy = createVincentAbilityPolicy({
  abilityParamsSchema,
  bundledVincentPolicy,
  abilityParameterMappings: {
    rpcUrlForUniswap: 'rpcUrlForUniswap',
    chainIdForUniswap: 'chainIdForUniswap',
    ethRpcUrl: 'ethRpcUrl',
    tokenInAddress: 'tokenAddress',
    tokenInDecimals: 'tokenDecimals',
    tokenInAmount: 'buyAmount',
  },
});

export const bigintReplacer = (key: any, value: any) => {
  return typeof value === 'bigint' ? value.toString() : value;
};

export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/vincent-ability-uniswap-swap' as const,
  abilityDescription: 'Performs a swap between two ERC20 tokens using Uniswap' as const,

  abilityParamsSchema,
  supportedPolicies: supportedPoliciesForAbility([SpendingLimitPolicy]),

  executeSuccessSchema,
  executeFailSchema,

  precheckSuccessSchema,
  precheckFailSchema,

  precheck: async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    // TODO: Rewrite checks to use `createAllowResult` and `createDenyResult` so we always know when we get a runtime err
    const {
      rpcUrlForUniswap,
      chainIdForUniswap,
      tokenInAddress,
      tokenInDecimals,
      tokenInAmount,
      tokenOutAddress,
      tokenOutDecimals,
      slippageTolerance,
    } = abilityParams;

    console.log('Prechecking UniswapSwapAbility', JSON.stringify(abilityParams, bigintReplacer, 2));

    if (tokenOutDecimals === undefined) {
      return fail({
        reason: 'tokenOutDecimals is required for precheck',
      });
    }

    const delegatorPkpAddress = delegatorPkpInfo.ethAddress;

    const provider = new ethers.providers.JsonRpcProvider(rpcUrlForUniswap);

    try {
      await checkNativeTokenBalance({
        provider,
        pkpEthAddress: delegatorPkpAddress as `0x${string}`,
      });
    } catch (err) {
      return fail({
        reason: `Native token balance error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }

    const requiredAmount = ethers.utils
      .parseUnits(tokenInAmount.toString(), tokenInDecimals)
      .toBigInt();

    try {
      await checkTokenInBalance({
        provider,
        pkpEthAddress: delegatorPkpAddress as `0x${string}`,
        tokenInAddress: tokenInAddress as `0x${string}`,
        tokenInAmount: requiredAmount,
      });
    } catch (err) {
      return fail({
        reason: `tokenIn balance check error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }

    // Get the full Uniswap route that will be used for the swap
    let quoteResponse: Awaited<ReturnType<typeof getUniswapQuote>>;
    let uniswapRouterAddress: string;
    try {
      quoteResponse = await getUniswapQuote({
        rpcUrl: rpcUrlForUniswap,
        chainId: chainIdForUniswap,
        tokenInAddress,
        tokenInDecimals,
        tokenInAmount,
        tokenOutAddress,
        tokenOutDecimals,
        recipient: delegatorPkpAddress,
        slippageTolerance,
      });

      if (!quoteResponse || !quoteResponse.methodParameters) {
        return fail({
          reason: `Failed to get route from Uniswap quote (UniswapSwapAbilityPrecheck)`,
        });
      }

      uniswapRouterAddress = quoteResponse.methodParameters.to;
    } catch (err) {
      return fail({
        reason: `Error getting route from Uniswap: ${err instanceof Error ? err.message : String(err)}`,
      });
    }

    try {
      await checkErc20Allowance({
        provider,
        tokenAddress: tokenInAddress as `0x${string}`,
        owner: delegatorPkpAddress as `0x${string}`,
        spender: uniswapRouterAddress,
        tokenAmount: requiredAmount,
      });
    } catch (err) {
      return fail({
        reason: `Error when checking ERC20 allowance for Uniswap router: ${uniswapRouterAddress}: ${err instanceof Error ? err.message : String(err)}`,
        erc20SpenderAddress: uniswapRouterAddress,
      });
    }

    return succeed({
      route: {
        to: uniswapRouterAddress,
        calldata: quoteResponse.methodParameters.calldata,
        estimatedGasUsed: quoteResponse.estimatedGasUsed.toString(),
      },
    });
  },
  execute: async (
    { abilityParams },
    { succeed, fail, policiesContext, delegation: { delegatorPkpInfo } },
  ) => {
    console.log('Executing UniswapSwapAbility', JSON.stringify(abilityParams, bigintReplacer, 2));

    const { ethAddress: delegatorPkpAddress, publicKey: delegatorPublicKey } = delegatorPkpInfo;
    const {
      ethRpcUrl,
      rpcUrlForUniswap,
      chainIdForUniswap,
      tokenInAddress,
      tokenInDecimals,
      tokenInAmount,
      tokenOutAddress,
      route,
    } = abilityParams;

    if (route === undefined) {
      return fail({
        reason: 'No Uniswap route provided, execute precheck to obtain a route.',
      });
    }

    // Validate the route to ensure it's calling a legitimate Uniswap router
    // and that it uses the correct tokenInAddress, tokenInAmount, and recipient
    //
    // NOTE: There's a possibility that we record a spend amount that is greater than the actual spend amount.
    // This is because the provided Uniswap route could use the exactOutputSingle or exactOutput methods,
    // which would use the tokenInAmount as the maximum amount to swap for tokenOut, which doesn't necessarily
    // have to be the full tokenInAmount if Uniswap finds a more efficient price.
    const routeValidation = validateUniswapRoute({
      route,
      chainId: chainIdForUniswap,
      tokenInAddress,
      tokenInAmount: ethers.utils.parseUnits(tokenInAmount.toString(), tokenInDecimals).toString(),
      tokenOutAddress,
      expectedRecipient: delegatorPkpAddress,
    });

    if (!routeValidation.valid) {
      return fail({
        reason: `Route validation failed: ${routeValidation.reason}`,
      });
    }

    // Commit spending limit before we submit the TX. We'd rather the tx fail and we count the spend erroneously
    // than to have the commit fail but the tx succeed, and we erroneously don't track the spend!
    const spendingLimitPolicyContext =
      policiesContext.allowedPolicies['@lit-protocol/vincent-policy-spending-limit'];

    let spendLimitCommitTxHash: string | undefined;

    if (spendingLimitPolicyContext !== undefined) {
      const tokenInAmountInUsd = await getTokenAmountInUsd({
        ethRpcUrl,
        rpcUrlForUniswap,
        chainIdForUniswap,
        tokenAddress: tokenInAddress,
        tokenAmount: tokenInAmount,
        tokenDecimals: tokenInDecimals,
        pkpEthAddress: delegatorPkpAddress,
      });

      const { maxSpendingLimitInUsd } = spendingLimitPolicyContext.result;

      console.log(
        'Spending limit policy commit',
        JSON.stringify(spendingLimitPolicyContext, bigintReplacer, 2),
      );

      try {
        const commitResult = await spendingLimitPolicyContext.commit({
          amountSpentUsd: tokenInAmountInUsd.toNumber(),
          maxSpendingLimitInUsd,
        });

        console.log(
          'Spending limit policy commit result',
          JSON.stringify(commitResult, bigintReplacer, 2),
        );
        if (commitResult.allow) {
          spendLimitCommitTxHash = commitResult.result.spendTxHash;
        } else {
          if (commitResult.runtimeError) {
            // Handle either an error that was `throw()`n from the commit method and wrapped by the sdk
            // Or an explicit schema validation error on input params or output result
            return fail({
              reason:
                'Commit spending limit policy spending limit adjustment due to un-structured error response.',
              spendingLimitCommitFail: {
                runtimeError: commitResult.runtimeError,
                schemaValidationError: commitResult.schemaValidationError,
              },
            });
          }

          // In this case we should have a result that is the shape of the commitDenyResultSchema from the policy to return
          return fail({
            reason:
              'Commit spending limit policy spending limit adjustment denied with structured result',
            spendingLimitCommitFail: {
              structuredCommitFailureReason: commitResult.result,
              runtimeError: commitResult.runtimeError,
              schemaValidationError: commitResult.schemaValidationError,
            },
          });
        }

        console.log(
          `Committed spending limit policy for transaction: ${spendLimitCommitTxHash} (UniswapSwapAbilityExecute)`,
        );
      } catch (commitErr) {
        // Commit methods are wrapped in code so that this should only happen if we encounter an error
        // _inside_ the wrapping code in the vincent-ability-sdk -- but let's handle it Just In Case :tm:
        return fail({
          reason:
            'Commit spending limit policy spending limit adjustment due to unexpected runtime error.',
          spendingLimitCommitFail: {
            runtimeError: commitErr instanceof Error ? commitErr.message : String(commitErr),
          },
        });
      }
    }

    const swapTxHash = await sendUniswapTxWithRoute({
      rpcUrl: rpcUrlForUniswap,
      chainId: chainIdForUniswap,
      pkpEthAddress: delegatorPkpAddress as `0x${string}`,
      pkpPublicKey: delegatorPublicKey,
      route,
    });

    return succeed({
      swapTxHash,
      spendTxHash: spendLimitCommitTxHash,
    });
  },
});
