import {
  createVincentAbility,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { base, getCallDataForSwap, getDefaultConfig, getQuoteForSwap } from 'sugar-sdk';
import { ethers } from 'ethers';

import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  precheckSuccessSchema,
  abilityParamsSchema,
} from './schemas';
import { AbilityAction, CheckNativeTokenBalanceResultSuccess } from './types';
import { checkErc20Allowance, checkErc20Balance, checkNativeTokenBalance } from './ability-checks';
import { executeSwapParams, getChainConfig, getSwapVars } from 'sugar-sdk/primitives';
import { findSupportedTokenOnBase } from './ability-helpers/find-supported-token-on-base';
import { sendAerodromeSwapTx, sendErc20ApprovalTx } from './ability-helpers';

export const bigintReplacer = (key: any, value: any) => {
  return typeof value === 'bigint' ? value.toString() : value;
};

export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/vincent-ability-aerodrome-swap' as const,
  abilityDescription: 'Ability to swap tokens on Aerodrome' as const,
  abilityParamsSchema,
  supportedPolicies: supportedPoliciesForAbility([]),

  precheckSuccessSchema,
  precheckFailSchema,

  executeSuccessSchema,
  executeFailSchema,

  precheck: async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    console.log(
      '[@lit-protocol/vincent-ability-aerodrome-swap precheck]',
      JSON.stringify(abilityParams, bigintReplacer, 2),
    );

    const { action, alchemyGasSponsor, rpcUrl, tokenInAddress, tokenOutAddress, amountIn } =
      abilityParams;

    const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);
    const sugarConfigBaseMainnet = getDefaultConfig({
      chains: [{ chain: base, rpcUrl }],
    });
    const sugarChainConfigBaseMainnet = getChainConfig(sugarConfigBaseMainnet.sugarConfig, base.id);

    // 1. If alchemyGasSponsor is not enabled, we need to check if the delegator has a non-zero amount of native token balance to pay for gas fees
    let checkNativeTokenBalanceResultSuccess: CheckNativeTokenBalanceResultSuccess | undefined;
    if (!alchemyGasSponsor) {
      const checkNativeTokenBalanceResult = await checkNativeTokenBalance({
        provider,
        pkpEthAddress: delegatorPkpInfo.ethAddress,
      });
      if (!checkNativeTokenBalanceResult.success) {
        return fail({
          reason: checkNativeTokenBalanceResult.reason,
        });
      }
      checkNativeTokenBalanceResultSuccess = checkNativeTokenBalanceResult;
    }

    // 2. Validate the input token is supported by Aerodrome on Base Mainnet
    const sugarTokenIn = await findSupportedTokenOnBase({
      config: sugarConfigBaseMainnet,
      chainId: base.id,
      tokenAddress: tokenInAddress,
    });
    if (!sugarTokenIn) {
      return fail({
        reason: `Token with address "${tokenInAddress}" not supported by Aerodrome on Base Mainnet`,
      });
    }

    const requiredTokenInAmount = ethers.utils.parseUnits(amountIn, sugarTokenIn.decimals);

    // 3. We retrieve the current allowance of the input token for the spender from the delegator
    const checkErc20AllowanceResult = await checkErc20Allowance({
      provider,
      tokenAddress: sugarTokenIn.address,
      owner: delegatorPkpInfo.ethAddress,
      spender: sugarChainConfigBaseMainnet.UNIVERSAL_ROUTER_ADDRESS,
      requiredAllowance: requiredTokenInAmount,
    });

    // 4. If the ability action is approve, we return the current allowance since all
    // precheck is concerned with is whether the delegatee can call execute with the approve ability action which just needs to know if
    // the gas for the approval transaction can be paid for (whether by gas sponsorship, or by the delegator).
    // We return the current allowance out of convenience, so the delegatee can know if
    // the current allowance is sufficient without having to call execute.
    if (action === AbilityAction.Approve) {
      return succeed({
        nativeTokenBalance: checkNativeTokenBalanceResultSuccess?.ethBalance.toString(),
        currentTokenInAllowanceForSpender: ethers.utils.formatUnits(
          checkErc20AllowanceResult.currentAllowance,
          sugarTokenIn.decimals,
        ),
        requiredTokenInAllowance: ethers.utils.formatUnits(
          checkErc20AllowanceResult.requiredAllowance,
          sugarTokenIn.decimals,
        ),
        spenderAddress: sugarChainConfigBaseMainnet.UNIVERSAL_ROUTER_ADDRESS,
      });
    }

    // 5. If the ability action is swap, and the current allowance is insufficient, we return a failure
    // because the swap cannot currently be performed.
    if (action === AbilityAction.Swap && !checkErc20AllowanceResult.success) {
      return fail({
        reason: checkErc20AllowanceResult.reason,
        spenderAddress: checkErc20AllowanceResult.spenderAddress,
        tokenAddress: checkErc20AllowanceResult.tokenAddress,
        requiredAllowance: ethers.utils.formatUnits(
          checkErc20AllowanceResult.requiredAllowance,
          sugarTokenIn.decimals,
        ),
        currentAllowance: ethers.utils.formatUnits(
          checkErc20AllowanceResult.currentAllowance,
          sugarTokenIn.decimals,
        ),
      });
    }

    // 6. At this point, the ability action is swap, and the current allowance is sufficient.
    // We now need to check if the current delegator balance of tokenIn is sufficient to perform the swap.
    const checkErc20BalanceResult = await checkErc20Balance({
      provider,
      pkpEthAddress: delegatorPkpInfo.ethAddress,
      tokenAddress: sugarTokenIn.address,
      requiredTokenAmount: requiredTokenInAmount,
    });
    if (!checkErc20BalanceResult.success) {
      return fail({
        reason: checkErc20BalanceResult.reason,
        tokenAddress: checkErc20BalanceResult.tokenAddress,
        requiredTokenAmount: ethers.utils.formatUnits(
          checkErc20BalanceResult.requiredTokenAmount,
          sugarTokenIn.decimals,
        ),
        tokenBalance: ethers.utils.formatUnits(
          checkErc20BalanceResult.tokenBalance,
          sugarTokenIn.decimals,
        ),
      });
    }

    // 7. Validate the tokenOut is supported by Aerodrome on Base Mainnet
    const sugarTokenOut = await findSupportedTokenOnBase({
      config: sugarConfigBaseMainnet,
      chainId: base.id,
      tokenAddress: tokenOutAddress,
    });
    if (!sugarTokenOut) {
      return fail({
        reason: `Token with address "${tokenOutAddress}" not supported by Aerodrome on Base Mainnet`,
      });
    }

    // 8. Validate a swap quote can be generated for the desired swap tokens and amounts
    const quote = await getQuoteForSwap({
      config: sugarConfigBaseMainnet,
      fromToken: sugarTokenIn,
      toToken: sugarTokenOut,
      amountIn: requiredTokenInAmount.toBigInt(),
    });
    if (quote === null) {
      return fail({
        reason: 'No Aerodrome swap quote available for the desired swap tokens and amounts',
      });
    }

    // 9. Return success, we've validated:
    // - Native token balance is non-zero or alchemyGasSponsor is enabled
    // - TokenIn is supported by Aerodrome on Base Mainnet
    // - Current allowance of tokenIn for the spender is sufficient
    // - Delegator's balance of tokenIn is sufficient
    // - TokenOut is supported by Aerodrome on Base Mainnet
    // - Swap quote is available for the desired swap tokens and amounts
    return succeed({
      nativeTokenBalance: checkNativeTokenBalanceResultSuccess?.ethBalance.toString(),
      tokenInAddress: sugarTokenIn.address,
      tokenInBalance: ethers.utils.formatUnits(
        checkErc20BalanceResult.tokenBalance,
        sugarTokenIn.decimals,
      ),
      currentTokenInAllowanceForSpender: ethers.utils.formatUnits(
        checkErc20AllowanceResult.currentAllowance,
        sugarTokenIn.decimals,
      ),
      requiredTokenInAllowance: ethers.utils.formatUnits(
        checkErc20AllowanceResult.requiredAllowance,
        sugarTokenIn.decimals,
      ),
      spenderAddress: sugarChainConfigBaseMainnet.UNIVERSAL_ROUTER_ADDRESS,
      quote: {
        tokenInAmount: ethers.utils.formatUnits(quote.amount, sugarTokenIn.decimals),
        tokenOutAmount: ethers.utils.formatUnits(quote.amountOut, sugarTokenOut.decimals),
        priceImpact: quote.priceImpact.toString(),
      },
    });
  },
  execute: async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    const {
      action,
      alchemyGasSponsor,
      alchemyGasSponsorApiKey,
      alchemyGasSponsorPolicyId,
      rpcUrl,
      tokenInAddress,
      tokenOutAddress,
      amountIn,
      slippage,
      gasBufferPercentage,
      baseFeePerGasBufferPercentage,
    } = abilityParams;

    // If you update the default slippage here, make sure to update the default slippage in the Zod schema as well.
    const SLIPPAGE = slippage ?? 0.005;

    const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);
    const sugarConfigBaseMainnet = getDefaultConfig({
      chains: [{ chain: base, rpcUrl }],
    });
    const sugarChainConfigBaseMainnet = getChainConfig(sugarConfigBaseMainnet.sugarConfig, base.id);

    // 1. Get the Sugar Token for tokenIn
    console.log(
      '[@lit-protocol/vincent-ability-aerodrome-swap execute] Getting Sugar Token for tokenIn',
    );
    const sugarTokenIn = await findSupportedTokenOnBase({
      config: sugarConfigBaseMainnet,
      chainId: base.id,
      tokenAddress: tokenInAddress,
    });
    if (!sugarTokenIn) {
      return fail({
        reason: `Token with address "${tokenInAddress}" not supported by Aerodrome on Base Mainnet`,
      });
    }

    const requiredTokenInAmount = ethers.utils.parseUnits(amountIn, sugarTokenIn.decimals);

    // 2. If the ability action is approve, we return success if allowance is sufficient, otherwise we send a new approval transaction
    let approvalTxHash: string | undefined;
    let approvalTxUserOperationHash: string | undefined;
    if (action === AbilityAction.Approve) {
      console.log(
        '[@lit-protocol/vincent-ability-aerodrome-swap execute] Checking if allowance is sufficient',
      );
      const checkErc20AllowanceResult = await checkErc20Allowance({
        provider,
        tokenAddress: sugarTokenIn.address,
        owner: delegatorPkpInfo.ethAddress,
        spender: sugarChainConfigBaseMainnet.UNIVERSAL_ROUTER_ADDRESS,
        requiredAllowance: requiredTokenInAmount,
      });

      if (checkErc20AllowanceResult.success) {
        console.log(
          `Sufficient allowance already exists for spender ${sugarChainConfigBaseMainnet.UNIVERSAL_ROUTER_ADDRESS}, skipping approval transaction. Current allowance: ${ethers.utils.formatUnits(
            checkErc20AllowanceResult.currentAllowance,
            sugarTokenIn.decimals,
          )}`,
        );

        // 2.1 Because the ability action is approve, we return success since the current allowance is sufficient,
        // and a new approval transaction is not needed.
        console.log(
          '[@lit-protocol/vincent-ability-aerodrome-swap execute] Allowance is sufficient, returning success',
        );
        return succeed({
          currentAllowance: ethers.utils.formatUnits(
            checkErc20AllowanceResult.currentAllowance,
            sugarTokenIn.decimals,
          ),
          requiredAllowance: ethers.utils.formatUnits(
            checkErc20AllowanceResult.requiredAllowance,
            sugarTokenIn.decimals,
          ),
        });
      } else {
        if (checkErc20AllowanceResult.reason.includes('insufficient ERC20 allowance for spender')) {
          // 2.2 The current allowance is insufficient, so we need to send a new approval transaction
          console.log(
            '[@lit-protocol/vincent-ability-aerodrome-swap execute] Sending new approval transaction',
          );
          const txHash = await sendErc20ApprovalTx({
            rpcUrl,
            chainId: base.id,
            pkpEthAddress: delegatorPkpInfo.ethAddress,
            pkpPublicKey: delegatorPkpInfo.publicKey,
            spenderAddress: sugarChainConfigBaseMainnet.UNIVERSAL_ROUTER_ADDRESS,
            allowanceAmount: requiredTokenInAmount.toString(),
            erc20TokenAddress: sugarTokenIn.address,
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
          // 2.3 Some error other than insufficient allowance occurred, bail out
          console.log(
            '[@lit-protocol/vincent-ability-aerodrome-swap execute] Some error other than insufficient allowance occurred, returning failure',
          );
          return fail({
            reason: checkErc20AllowanceResult.reason,
          });
        }
      }
    }

    // 3. If the ability action is swap, perform the swap
    let swapTxHash: string | undefined;
    let swapTxUserOperationHash: string | undefined;
    if (action === AbilityAction.Swap) {
      // 3.1 Get the Sugar Token for tokenOut
      console.log(
        '[@lit-protocol/vincent-ability-aerodrome-swap execute] Getting Sugar Token for tokenOut',
      );
      const sugarTokenOut = await findSupportedTokenOnBase({
        config: sugarConfigBaseMainnet,
        chainId: base.id,
        tokenAddress: tokenOutAddress,
      });
      if (!sugarTokenOut) {
        return fail({
          reason: `Token with address "${tokenOutAddress}" not supported by Aerodrome on Base Mainnet`,
        });
      }

      // 3.2 Get the swap quote
      // TODO Wrap in runOnce
      console.log('[@lit-protocol/vincent-ability-aerodrome-swap execute] Getting swap quote');
      const quote = await getQuoteForSwap({
        config: sugarConfigBaseMainnet,
        fromToken: sugarTokenIn,
        toToken: sugarTokenOut,
        amountIn: requiredTokenInAmount.toBigInt(),
      });
      if (quote === null) {
        return fail({
          reason: 'No Aerodrome swap quote available for the desired swap tokens and amounts',
        });
      }

      // 3.3 Get the Sugar calldata for the swap quote
      console.log(
        '[@lit-protocol/vincent-ability-aerodrome-swap execute] Getting Sugar calldata for swap quote',
      );
      const sugarCallDataForSwap = await getCallDataForSwap({
        config: sugarConfigBaseMainnet,
        fromToken: quote.fromToken,
        toToken: quote.toToken,
        amountIn: requiredTokenInAmount.toBigInt(),
        account: delegatorPkpInfo.ethAddress as `0x${string}`,
        slippage: SLIPPAGE,
      });
      if (sugarCallDataForSwap === null) {
        return fail({
          reason: 'Unable to generate call data for the Aerodrome swap quote',
        });
      }

      // 3.4 Get the Sugar swap vars for the swap quote
      console.log(
        '[@lit-protocol/vincent-ability-aerodrome-swap execute] Getting Sugar swap vars for swap quote',
      );
      const { chainId, planner, amount } = getSwapVars(
        sugarConfigBaseMainnet.sugarConfig,
        quote,
        `${Math.ceil(SLIPPAGE * 100)}`,
        delegatorPkpInfo.ethAddress as `0x${string}`,
      );

      // 3.5 Get the Sugar execute swap params for the swap quote
      console.log(
        '[@lit-protocol/vincent-ability-aerodrome-swap execute] Getting Sugar execute swap params for swap quote',
      );
      const sugarExecuteSwapParams = executeSwapParams({
        config: sugarConfigBaseMainnet.sugarConfig,
        chainId,
        // @ts-expect-error Type 'string' is not assignable to type '`0x${string}`'
        commands: planner.commands,
        inputs: planner.inputs,
        value: amount,
      });

      // 3.6 ABI encode the swap params for ethers calldata
      console.log(
        '[@lit-protocol/vincent-ability-aerodrome-swap execute] ABI encoding swap params for ethers calldata',
      );
      const executeInterface = new ethers.utils.Interface(sugarExecuteSwapParams.abi);
      const encodedCalldataForEthers = executeInterface.encodeFunctionData(
        'execute(bytes,bytes[])',
        [planner.commands, planner.inputs],
      );

      // 3.7 Send the swap transaction
      console.log(
        '[@lit-protocol/vincent-ability-aerodrome-swap execute] Sending swap transaction',
      );
      const txHash = await sendAerodromeSwapTx({
        rpcUrl,
        chainId: base.id,
        pkpEthAddress: delegatorPkpInfo.ethAddress,
        pkpPublicKey: delegatorPkpInfo.publicKey,
        to: sugarChainConfigBaseMainnet.UNIVERSAL_ROUTER_ADDRESS,
        value: amount.toString(),
        calldata: encodedCalldataForEthers,
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

    // 4. If the ability action is:
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
