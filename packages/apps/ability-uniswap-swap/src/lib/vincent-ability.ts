import {
  createVincentAbility,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { ethers } from 'ethers';

import { sendUniswapTx } from './ability-helpers';
import { checkErc20Balance, checkErc20Allowance, checkNativeTokenBalance } from './ability-checks';
import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  precheckSuccessSchema,
  abilityParamsSchema,
} from './schemas';
import { validateSignedUniswapQuote } from './prepare/validate-signed-uniswap-quote';
import VincentPrepareMetadata from '../generated/vincent-prepare-metadata.json';
import { AbilityAction, CheckNativeTokenBalanceResultSuccess } from './types';
import { sendErc20ApprovalTx } from './ability-helpers/send-erc20-approval-tx';

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
    const { action, alchemyGasSponsor, rpcUrlForUniswap, signedUniswapQuote } = abilityParams;
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

    // 1. If alchemyGasSponsor is not enabled, we need to check if the delegator has a non-zero amount of native token balance to pay for gas fees
    let checkNativeTokenBalanceResultSuccess: CheckNativeTokenBalanceResultSuccess | undefined;
    if (!alchemyGasSponsor) {
      const checkNativeTokenBalanceResult = await checkNativeTokenBalance({
        provider,
        pkpEthAddress: delegatorPkpAddress,
      });
      if (!checkNativeTokenBalanceResult.success) {
        return fail({
          reason: checkNativeTokenBalanceResult.reason,
        });
      }
      checkNativeTokenBalanceResultSuccess = checkNativeTokenBalanceResult;
    }

    const requiredTokenInAmount = ethers.utils.parseUnits(quote.amountIn, quote.tokenInDecimals);

    // 2. We retrieve the current allowance of the input token for the spender from the delegator
    const checkErc20AllowanceResult = await checkErc20Allowance({
      provider,
      tokenAddress: quote.tokenIn,
      owner: delegatorPkpInfo.ethAddress,
      spender: quote.to,
      requiredAllowance: requiredTokenInAmount,
    });

    // 3. If the ability action is approve, we return the current allowance since all
    // precheck is concerned with is whether the delegatee can call execute with the approve ability action which just needs to know if
    // the gas for the approval transaction can be paid for (whether by gas sponsorship, or by the delegator).
    // We return the current allowance out of convenience, so the delegatee can know if
    // the current allowance is sufficient without having to call execute.
    if (action === AbilityAction.Approve) {
      return succeed({
        nativeTokenBalance: checkNativeTokenBalanceResultSuccess?.ethBalance.toString(),
        currentTokenInAllowanceForSpender: ethers.utils.formatUnits(
          checkErc20AllowanceResult.currentAllowance,
          quote.tokenInDecimals,
        ),
        requiredTokenInAllowance: ethers.utils.formatUnits(
          checkErc20AllowanceResult.requiredAllowance,
          quote.tokenInDecimals,
        ),
        spenderAddress: checkErc20AllowanceResult.spenderAddress,
      });
    }

    // 4. If the ability action is swap, and the current allowance is insufficient, we return a failure
    // because the swap cannot currently be performed.
    if (action === AbilityAction.Swap && !checkErc20AllowanceResult.success) {
      return fail({
        reason: checkErc20AllowanceResult.reason,
        spenderAddress: checkErc20AllowanceResult.spenderAddress,
        tokenAddress: checkErc20AllowanceResult.tokenAddress,
        requiredAllowance: ethers.utils.formatUnits(
          checkErc20AllowanceResult.requiredAllowance,
          quote.tokenInDecimals,
        ),
        currentAllowance: ethers.utils.formatUnits(
          checkErc20AllowanceResult.currentAllowance,
          quote.tokenInDecimals,
        ),
      });
    }

    // 5. At this point, the ability action is swap, and the current allowance is sufficient.
    // We now need to check if the current delegator balance of tokenIn is sufficient to perform the swap.
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
        requiredTokenAmount: ethers.utils.formatUnits(
          checkErc20BalanceResult.requiredTokenAmount,
          quote.tokenInDecimals,
        ),
        tokenBalance: ethers.utils.formatUnits(
          checkErc20BalanceResult.tokenBalance,
          quote.tokenInDecimals,
        ),
      });
    }

    // 6. At this point, we know that the current allowance and
    // the delegator's balance of tokenIn are sufficient to perform the swap
    return succeed({
      nativeTokenBalance: checkNativeTokenBalanceResultSuccess?.ethBalance.toString(),
      tokenInAddress: checkErc20BalanceResult.tokenAddress,
      tokenInBalance: ethers.utils.formatUnits(
        checkErc20BalanceResult.tokenBalance,
        quote.tokenInDecimals,
      ),
      currentTokenInAllowanceForSpender: ethers.utils.formatUnits(
        checkErc20AllowanceResult.currentAllowance,
        quote.tokenInDecimals,
      ),
      requiredTokenInAllowance: ethers.utils.formatUnits(
        checkErc20AllowanceResult.requiredAllowance,
        quote.tokenInDecimals,
      ),
      spenderAddress: checkErc20AllowanceResult.spenderAddress,
    });
  },
  execute: async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    console.log('Executing UniswapSwapAbility', JSON.stringify(abilityParams, bigintReplacer, 2));

    const {
      action,
      rpcUrlForUniswap,
      signedUniswapQuote,
      gasBufferPercentage,
      baseFeePerGasBufferPercentage,
      alchemyGasSponsor,
      alchemyGasSponsorApiKey,
      alchemyGasSponsorPolicyId,
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

    // 1. If the ability action is approve, we return success if allowance is sufficient, otherwise we send a new approval transaction
    let approvalTxHash: string | undefined;
    let approvalTxUserOperationHash: string | undefined;
    if (action === AbilityAction.Approve) {
      const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrlForUniswap);

      const requiredTokenInAmount = ethers.utils.parseUnits(quote.amountIn, quote.tokenInDecimals);

      const checkErc20AllowanceResult = await checkErc20Allowance({
        provider,
        tokenAddress: quote.tokenIn,
        owner: delegatorPkpInfo.ethAddress,
        spender: quote.to,
        requiredAllowance: requiredTokenInAmount,
      });

      if (checkErc20AllowanceResult.success) {
        console.log(
          `Sufficient allowance already exists for spender ${quote.to}, skipping approval transaction. Current allowance: ${checkErc20AllowanceResult.currentAllowance.toString()}`,
        );

        // 1.1 Because the ability action is approve, we return success since the current allowance is sufficient,
        // and a new approval transaction is not needed.
        return succeed({
          currentAllowance: ethers.utils.formatUnits(
            checkErc20AllowanceResult.currentAllowance,
            quote.tokenInDecimals,
          ),
          requiredAllowance: ethers.utils.formatUnits(
            checkErc20AllowanceResult.requiredAllowance,
            quote.tokenInDecimals,
          ),
        });
      } else {
        if (checkErc20AllowanceResult.reason.includes('insufficient ERC20 allowance for spender')) {
          // 1.2 The current allowance is insufficient, so we need to send a new approval transaction
          const txHash = await sendErc20ApprovalTx({
            rpcUrl: rpcUrlForUniswap,
            chainId: quote.chainId,
            pkpEthAddress: delegatorPkpInfo.ethAddress,
            pkpPublicKey: delegatorPkpInfo.publicKey,
            spenderAddress: quote.to,
            allowanceAmount: requiredTokenInAmount.toString(),
            erc20TokenAddress: quote.tokenIn,
            alchemyGasSponsor,
            alchemyGasSponsorApiKey,
            alchemyGasSponsorPolicyId,
          });

          if (alchemyGasSponsor) {
            approvalTxUserOperationHash = txHash;
          } else {
            approvalTxHash = txHash;
          }
        } else {
          // 1.3 Some error other than insufficient allowance occurred, bail out
          return fail({
            reason: checkErc20AllowanceResult.reason,
          });
        }
      }
    }

    let swapTxHash: string | undefined;
    let swapTxUserOperationHash: string | undefined;
    if (action === AbilityAction.Swap) {
      // 2. The ability action is swap, so we send the swap transaction
      const txHash = await sendUniswapTx({
        rpcUrl: rpcUrlForUniswap,
        chainId: quote.chainId,
        pkpEthAddress: delegatorPkpInfo.ethAddress,
        pkpPublicKey: delegatorPkpInfo.publicKey,
        to: quote.to,
        value: quote.value,
        calldata: quote.calldata,
        gasBufferPercentage,
        baseFeePerGasBufferPercentage,
        alchemyGasSponsor,
        alchemyGasSponsorApiKey,
        alchemyGasSponsorPolicyId,
      });

      if (alchemyGasSponsor) {
        swapTxUserOperationHash = txHash;
      } else {
        swapTxHash = txHash;
      }
    }

    // 3. If the ability action is:
    // - Approve, we return the approval transaction hash.
    // - Swap, we return the swap transaction hash.
    return succeed({
      approvalTxHash,
      approvalTxUserOperationHash,
      swapTxHash,
      swapTxUserOperationHash,
    });
  },
});
