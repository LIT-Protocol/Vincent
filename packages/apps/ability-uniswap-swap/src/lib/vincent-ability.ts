import {
  createVincentAbility,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { ethers } from 'ethers';

import { sendUniswapTx } from './ability-helpers';
import { checkNativeTokenBalance, checkTokenInBalance } from './ability-checks';
import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  abilityParamsSchema,
} from './schemas';
import { checkErc20Allowance } from './ability-checks/check-erc20-allowance';
import { validateSignedUniswapQuote } from './prepare/validate-signed-uniswap-quote';
import VincentPrepareMetadata from '../generated/vincent-prepare-metadata.json';

export const bigintReplacer = (key: any, value: any) => {
  return typeof value === 'bigint' ? value.toString() : value;
};

export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/vincent-ability-uniswap-swap' as const,
  abilityDescription: 'Performs a swap between two ERC20 tokens using Uniswap' as const,

  abilityParamsSchema,
  supportedPolicies: supportedPoliciesForAbility([]),

  executeSuccessSchema,
  executeFailSchema,

  precheckFailSchema,

  precheck: async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    console.log('Prechecking UniswapSwapAbility', JSON.stringify(abilityParams, bigintReplacer, 2));

    // TODO: Rewrite checks to use `createAllowResult` and `createDenyResult` so we always know when we get a runtime err
    const { rpcUrlForUniswap, signedUniswapQuote } = abilityParams;
    const { quote } = signedUniswapQuote;

    try {
      validateSignedUniswapQuote({
        prepareSuccessResult: signedUniswapQuote,
        expectedSignerEthAddress: VincentPrepareMetadata.pkpEthAddress,
      });
    } catch (error) {
      return fail({
        reason: `Uniswap quote validation failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    const delegatorPkpAddress = delegatorPkpInfo.ethAddress;
    const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrlForUniswap);

    try {
      await checkNativeTokenBalance({
        provider,
        pkpEthAddress: delegatorPkpAddress,
      });
    } catch (err) {
      return fail({
        reason: `Native token balance error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }

    const requiredAmount = ethers.utils
      .parseUnits(quote.amountIn, quote.tokenInDecimals)
      .toBigInt();

    try {
      await checkTokenInBalance({
        provider,
        pkpEthAddress: delegatorPkpAddress,
        tokenInAddress: quote.tokenIn,
        tokenInAmount: requiredAmount,
      });
    } catch (err) {
      return fail({
        reason: `tokenIn balance check error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }

    // Check ERC20 allowance for the router specified in the route
    try {
      await checkErc20Allowance({
        provider,
        tokenAddress: quote.tokenIn,
        owner: delegatorPkpAddress,
        spender: quote.to,
        tokenAmount: requiredAmount,
      });
    } catch (err) {
      return fail({
        reason: `ERC20 allowance check error: ${err instanceof Error ? err.message : String(err)}`,
        erc20SpenderAddress: quote.to,
      });
    }

    return succeed();
  },
  execute: async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    console.log('Executing UniswapSwapAbility', JSON.stringify(abilityParams, bigintReplacer, 2));

    const { rpcUrlForUniswap, signedUniswapQuote } = abilityParams;
    const { quote } = signedUniswapQuote;

    try {
      validateSignedUniswapQuote({
        prepareSuccessResult: signedUniswapQuote,
        expectedSignerEthAddress: VincentPrepareMetadata.pkpEthAddress,
      });
    } catch (error) {
      return fail({
        reason: `Uniswap quote validation failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    const swapTxHash = await sendUniswapTx({
      rpcUrl: rpcUrlForUniswap,
      chainId: quote.chainId,
      pkpEthAddress: delegatorPkpInfo.ethAddress,
      pkpPublicKey: delegatorPkpInfo.publicKey,
      uniswapTxData: {
        to: quote.to,
        calldata: quote.calldata,
        estimatedGasUsed: quote.estimatedGasUsed,
      },
    });

    return succeed({ swapTxHash });
  },
});
