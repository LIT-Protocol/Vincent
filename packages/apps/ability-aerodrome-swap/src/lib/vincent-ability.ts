import {
  createVincentAbility,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { base, getDefaultConfig, getQuoteForSwap, swap } from '@dromos-labs/sdk.js';
import { ethers } from 'ethers';

import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  precheckSuccessSchema,
  abilityParamsSchema,
  DEFAULT_AERODROME_SWAP_SLIPPAGE,
} from './schemas';
import { AbilityAction, CheckNativeTokenBalanceResultSuccess } from './types';
import { checkErc20Allowance, checkErc20Balance, checkNativeTokenBalance } from './ability-checks';
import { getChainConfig, type Quote } from '@dromos-labs/sdk.js/primitives';
import { findSupportedTokenOnBase } from './ability-helpers/find-supported-token-on-base';
import { sendAerodromeSwapTx, sendErc20ApprovalTx } from './ability-helpers';

export const bigintReplacer = (key: any, value: any) => {
  return typeof value === 'bigint' ? value.toString() : value;
};

export const sugarSdkQuoteBigintReviver = (key: any, value: any) => {
  // Convert string values that were BigInts back to BigInt for the
  // Sugar SDK Quote object:
  // @dromos-labs/sdk.js/dist/primitives/externals/app/src/hooks/types.d.ts
  if (
    typeof value === 'string' &&
    (key === 'amount' ||
      key === 'amountOut' ||
      key === 'priceImpact' ||
      key === 'balance' ||
      key === 'price' ||
      key === 'pool_fee' ||
      key === 'balanceValue')
  ) {
    return BigInt(value);
  }
  return value;
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

    const requiredTokenInAmount = ethers.BigNumber.from(amountIn);

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
        currentTokenInAllowanceForSpender: checkErc20AllowanceResult.currentAllowance.toString(),
        requiredTokenInAllowance: checkErc20AllowanceResult.requiredAllowance.toString(),
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
        requiredAllowance: checkErc20AllowanceResult.requiredAllowance.toString(),
        currentAllowance: checkErc20AllowanceResult.currentAllowance.toString(),
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
        requiredTokenAmount: checkErc20BalanceResult.requiredTokenAmount.toString(),
        tokenBalance: checkErc20BalanceResult.tokenBalance.toString(),
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
      tokenInBalance: checkErc20BalanceResult.tokenBalance.toString(),
      currentTokenInAllowanceForSpender: checkErc20AllowanceResult.currentAllowance.toString(),
      requiredTokenInAllowance: checkErc20AllowanceResult.requiredAllowance.toString(),
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

    const SLIPPAGE = slippage ?? DEFAULT_AERODROME_SWAP_SLIPPAGE;

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

    const requiredTokenInAmount = ethers.BigNumber.from(amountIn);

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
          currentAllowance: checkErc20AllowanceResult.currentAllowance.toString(),
          requiredAllowance: checkErc20AllowanceResult.requiredAllowance.toString(),
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
      console.log('[@lit-protocol/vincent-ability-aerodrome-swap execute] Getting swap quote');
      const quoteResponse = await Lit.Actions.runOnce(
        { waitForResponse: true, name: 'Aerodrome swap quote' },
        async () => {
          try {
            const quote = await getQuoteForSwap({
              config: sugarConfigBaseMainnet,
              fromToken: sugarTokenIn,
              toToken: sugarTokenOut,
              amountIn: requiredTokenInAmount.toBigInt(),
            });
            if (quote === null) {
              return JSON.stringify({
                status: 'error',
                error: 'No Aerodrome swap quote available for the desired swap tokens and amounts',
              });
            }
            return JSON.stringify(
              {
                status: 'success',
                quote,
              },
              bigintReplacer,
            );
          } catch (error) {
            return JSON.stringify({
              status: 'error',
              error: error instanceof Error ? error.message : String(error),
            });
          }
        },
      );
      const parsedQuoteResponse = JSON.parse(quoteResponse, sugarSdkQuoteBigintReviver);
      if (parsedQuoteResponse.status === 'error') {
        return fail({
          reason: parsedQuoteResponse.error,
        });
      }
      const { quote }: { quote: Quote } = parsedQuoteResponse;

      // 3.3 Get the swap calldata
      console.log('[@lit-protocol/vincent-ability-aerodrome-swap execute] Getting swap calldata');
      const swapData = await swap({
        config: sugarConfigBaseMainnet,
        quote,
        account: delegatorPkpInfo.ethAddress as `0x${string}`,
        slippage: SLIPPAGE,
        unsignedTransactionOnly: true,
      });

      // 3.4 Send the swap transaction
      console.log(
        '[@lit-protocol/vincent-ability-aerodrome-swap execute] Sending swap transaction',
      );
      const txHash = await sendAerodromeSwapTx({
        rpcUrl,
        chainId: swapData.chainId,
        pkpEthAddress: delegatorPkpInfo.ethAddress,
        pkpPublicKey: delegatorPkpInfo.publicKey,
        to: swapData.to,
        value: swapData.value.toString(),
        calldata: swapData.data,
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
