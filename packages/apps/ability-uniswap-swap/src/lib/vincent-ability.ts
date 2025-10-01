import {
  createVincentAbility,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { ethers } from 'ethers';

import { sendUniswapTx } from './ability-helpers';
import { checkNativeTokenBalance, checkErc20Balance } from './ability-checks';
import {
  executeFailSchema,
  executeSuccessSchema,
  precheckSuccessSchema,
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

  precheckSuccessSchema,
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
        expectedRecipientEthAddress: delegatorPkpInfo.ethAddress,
      });
    } catch (error) {
      return fail({
        reason: `Uniswap quote validation failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    const delegatorPkpAddress = delegatorPkpInfo.ethAddress;
    const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrlForUniswap);

    const checkNativeTokenBalanceResult = await checkNativeTokenBalance({
      provider,
      pkpEthAddress: delegatorPkpAddress,
    });
    if (!checkNativeTokenBalanceResult.success) {
      return fail({
        reason: checkNativeTokenBalanceResult.reason,
      });
    }

    const requiredTokenInAmount = ethers.utils.parseUnits(quote.amountIn, quote.tokenInDecimals);

    const checkErc20BalanceResult = await checkErc20Balance({
      provider,
      pkpEthAddress: delegatorPkpAddress,
      tokenAddress: quote.tokenIn,
      requiredTokenAmount: requiredTokenInAmount,
    });
    if (!checkErc20BalanceResult.success) {
      return fail({
        reason: checkErc20BalanceResult.reason,
        tokenAddress: checkErc20BalanceResult.tokenAddress,
        requiredTokenAmount: checkErc20BalanceResult.requiredTokenAmount.toString(),
        tokenBalance: checkErc20BalanceResult.tokenBalance.toString(),
      });
    }

    const checkErc20AllowanceResult = await checkErc20Allowance({
      provider,
      tokenAddress: quote.tokenIn,
      owner: delegatorPkpAddress,
      spender: quote.to,
      requiredAllowance: requiredTokenInAmount,
    });
    if (!checkErc20AllowanceResult.success) {
      return fail({
        reason: checkErc20AllowanceResult.reason,
        spenderAddress: checkErc20AllowanceResult.spenderAddress,
        tokenAddress: checkErc20AllowanceResult.tokenAddress,
        requiredAllowance: checkErc20AllowanceResult.requiredAllowance.toString(),
        currentAllowance: checkErc20AllowanceResult.currentAllowance.toString(),
      });
    }

    return succeed({
      nativeTokenBalance: checkNativeTokenBalanceResult.ethBalance.toString(),
      tokenInAddress: checkErc20BalanceResult.tokenAddress,
      tokenInBalance: checkErc20BalanceResult.tokenBalance.toString(),
      currentTokenInAllowanceForSpender: checkErc20AllowanceResult.currentAllowance.toString(),
      spenderAddress: checkErc20AllowanceResult.spenderAddress,
    });
  },
  execute: async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    console.log('Executing UniswapSwapAbility', JSON.stringify(abilityParams, bigintReplacer, 2));

    const {
      rpcUrlForUniswap,
      signedUniswapQuote,
      gasBufferPercentage,
      baseFeePerGasBufferPercentage,
    } = abilityParams;
    const { quote } = signedUniswapQuote;

    try {
      validateSignedUniswapQuote({
        prepareSuccessResult: signedUniswapQuote,
        expectedSignerEthAddress: VincentPrepareMetadata.pkpEthAddress,
        expectedRecipientEthAddress: delegatorPkpInfo.ethAddress,
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
      to: quote.to,
      value: quote.value,
      calldata: quote.calldata,
      gasBufferPercentage,
      baseFeePerGasBufferPercentage,
    });

    return succeed({ swapTxHash });
  },
});
