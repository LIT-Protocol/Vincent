import {
  createVincentAbility,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { ethers } from 'ethers';
import {
  validateSignedUniswapQuote,
  vincentPrepareMetadata,
} from '@lit-protocol/vincent-ability-uniswap-swap';

import { getCurrentAllowance, checkNativeTokenBalance } from './helpers';
import { sendErc20ApprovalTx } from './lit-action-helpers';
import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  precheckSuccessSchema,
  abilityParamsSchema,
} from './schemas';

export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/vincent-ability-erc20-approval' as const,
  abilityDescription:
    'Allow, up to a limit, of an ERC20 token spending to another address.' as const,
  abilityParamsSchema,
  supportedPolicies: supportedPoliciesForAbility([]),

  precheckSuccessSchema,
  precheckFailSchema,

  executeSuccessSchema,
  executeFailSchema,

  precheck: async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    const { ethAddress } = delegatorPkpInfo;
    const { alchemyGasSponsor, rpcUrl, signedUniswapQuote } = abilityParams;
    const { quote } = signedUniswapQuote;

    try {
      validateSignedUniswapQuote({
        prepareSuccessResult: signedUniswapQuote,
        expectedSignerEthAddress: vincentPrepareMetadata.pkpEthAddress,
        expectedRecipientEthAddress: delegatorPkpInfo.ethAddress,
      });
    } catch (error) {
      return fail({
        reason: `Uniswap quote validation failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);

    if (!alchemyGasSponsor) {
      const hasNativeTokenBalance = await checkNativeTokenBalance({
        provider,
        pkpEthAddress: ethAddress,
      });

      if (!hasNativeTokenBalance) {
        return fail({
          reason: `No native token balance to pay for gas fees`,
        });
      }
    }

    const currentAllowance = await getCurrentAllowance({
      provider,
      tokenAddress: quote.tokenIn,
      owner: ethAddress,
      spender: quote.to,
    });

    const requiredAmount = ethers.utils.parseUnits(quote.amountIn, quote.tokenInDecimals);

    if (currentAllowance.lt(requiredAmount)) {
      return fail({
        reason: `Insufficient allowance for spender ${quote.to} for token ${quote.tokenIn}`,
        spenderAddress: quote.to,
        tokenAddress: quote.tokenIn,
        requiredAllowance: requiredAmount.toString(),
        currentAllowance: currentAllowance.toString(),
      });
    }

    return succeed({
      tokenAddress: quote.tokenIn,
      spenderAddress: quote.to,
      currentAllowance: currentAllowance.toString(),
      requiredAllowance: requiredAmount.toString(),
    });
  },
  execute: async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    console.log('Executing ERC20 Approval Ability');

    const { ethAddress, publicKey } = delegatorPkpInfo;
    const {
      rpcUrl,
      signedUniswapQuote,
      alchemyGasSponsor,
      alchemyGasSponsorApiKey,
      alchemyGasSponsorPolicyId,
    } = abilityParams;
    const { quote } = signedUniswapQuote;

    try {
      validateSignedUniswapQuote({
        prepareSuccessResult: signedUniswapQuote,
        expectedSignerEthAddress: vincentPrepareMetadata.pkpEthAddress,
        expectedRecipientEthAddress: delegatorPkpInfo.ethAddress,
      });
    } catch (error) {
      return fail({
        reason: `Uniswap quote validation failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);

    if (!alchemyGasSponsor) {
      const hasNativeTokenBalance = await checkNativeTokenBalance({
        provider,
        pkpEthAddress: ethAddress,
      });

      if (!hasNativeTokenBalance) {
        return fail({
          reason: `No native token balance to pay for gas fees`,
        });
      }
    }

    const currentAllowance = await getCurrentAllowance({
      provider,
      tokenAddress: quote.tokenIn,
      owner: ethAddress,
      spender: quote.to,
    });

    const requiredAmount = ethers.utils.parseUnits(quote.amountIn, quote.tokenInDecimals);

    console.log(`requiredAmount: ${requiredAmount.toString()}`);
    console.log(`currentAllowance: ${currentAllowance.toString()}`);

    if (currentAllowance.gte(requiredAmount)) {
      return succeed({
        approvedAmount: currentAllowance.toString(),
        spenderAddress: quote.to,
        tokenAddress: quote.tokenIn,
      });
    }

    const approvalTxHash = await sendErc20ApprovalTx({
      rpcUrl,
      chainId: quote.chainId,
      pkpEthAddress: ethAddress,
      pkpPublicKey: publicKey,
      spenderAddress: quote.to,
      allowanceAmount: requiredAmount.toString(),
      erc20TokenAddress: quote.tokenIn,
      alchemyGasSponsor,
      alchemyGasSponsorApiKey,
      alchemyGasSponsorPolicyId,
    });

    return succeed({
      approvalTxHash,
      approvedAmount: requiredAmount.toString(),
      spenderAddress: quote.to,
      tokenAddress: quote.tokenIn,
    });
  },
});
