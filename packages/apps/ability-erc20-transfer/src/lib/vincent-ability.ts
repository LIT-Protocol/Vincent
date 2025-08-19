import {
  createVincentAbility,
  createVincentAbilityPolicy,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { bundledVincentPolicy } from '@lit-protocol/vincent-policy-send-counter';
import { ethers } from 'ethers';

import { ERC20_ABI, getErc20Contract } from './helpers';
import { commitAllowedPolicies } from './helpers/commit-allowed-policies';
import { executeOperation } from './helpers/execute-operation';
import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  precheckSuccessSchema,
  abilityParamsSchema,
} from './schemas';

const SendLimitPolicy = createVincentAbilityPolicy({
  abilityParamsSchema,
  bundledVincentPolicy,
  abilityParameterMappings: {
    to: 'to',
    amount: 'amount',
  },
});

export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/vincent-ability-erc20-transfer' as const,
  abilityDescription:
    'Ability to transfer ERC20 tokens with a limit on how many transfers are allowed in a time window' as const,
  abilityParamsSchema,
  supportedPolicies: supportedPoliciesForAbility([SendLimitPolicy]),

  precheckSuccessSchema,
  precheckFailSchema,

  executeSuccessSchema,
  executeFailSchema,

  precheck: async ({ abilityParams }, { succeed, fail, delegation }) => {
    console.log('[@agentic-ai/vincent-ability-erc20-transfer/precheck] 🔍 Starting validation');
    console.log('[@agentic-ai/vincent-ability-erc20-transfer/precheck] 📋 params:', {
      abilityParams,
    });

    const {
      to,
      amount,
      tokenAddress,
      rpcUrl,
      alchemyGasSponsor,
      alchemyGasSponsorApiKey,
      alchemyGasSponsorPolicyId,
    } = abilityParams;

    // Validate EIP-7702 gas sponsorship
    if (alchemyGasSponsor && (!alchemyGasSponsorApiKey || !alchemyGasSponsorPolicyId)) {
      return fail({
        error:
          '[@lit-protocol/vincent-ability-erc20-transfer/precheck] Alchemy gas sponsor is enabled, but missing Alchemy API key or policy ID',
      });
    }

    // Validate RPC URL
    if (!rpcUrl) {
      return fail({
        error:
          '[@lit-protocol/vincent-ability-erc20-transfer/precheck] RPC URL is required for precheck',
      });
    }

    // Check if the sender has enough tokens
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const erc20Contract = getErc20Contract(provider, tokenAddress);

    const tokenDecimals = await erc20Contract.decimals();
    console.log(
      '[@agentic-ai/vincent-ability-erc20-transfer/precheck] 🔢 Using token decimals:',
      tokenDecimals,
    );

    const tokenAmountInSmallestUnit = ethers.utils.parseUnits(amount, tokenDecimals);
    console.log(
      '[@agentic-ai/vincent-ability-erc20-transfer/precheck] 💰 Transfer amount in smallest unit:',
      tokenAmountInSmallestUnit.toString(),
    );

    // Check token balance
    const userBalance = await erc20Contract.balanceOf(delegation.delegatorPkpInfo.ethAddress);
    console.log(
      '[@agentic-ai/vincent-ability-erc20-transfer/precheck] 💰 User balance in smallest unit:',
      ethers.utils.formatUnits(userBalance, tokenDecimals),
    );

    if (userBalance.lt(tokenAmountInSmallestUnit)) {
      return fail({
        error: `[@agentic-ai/vincent-ability-erc20-transfer/precheck] ❌ Insufficient token balance. Need ${ethers.utils.formatUnits(tokenAmountInSmallestUnit, tokenDecimals)} tokens, but only have ${ethers.utils.formatUnits(userBalance, tokenDecimals)} tokens`,
      });
    }

    // Estimate transfer gas and check there is enough
    const estimatedGas = await erc20Contract.estimateGas.transfer(to, tokenAmountInSmallestUnit);
    console.log(
      '[@agentic-ai/vincent-ability-erc20-transfer/precheck] 💰 Estimated gas:',
      estimatedGas.toString(),
    );

    const nativeBalance = await provider.getBalance(delegation.delegatorPkpInfo.ethAddress);
    if (!alchemyGasSponsor && nativeBalance.lt(estimatedGas)) {
      return fail({
        error: `[@agentic-ai/vincent-ability-erc20-transfer/precheck] ❌ Insufficient gas for ERC20 transfer. Need ${estimatedGas.toString()} gas, but only have ${nativeBalance.toString()} gas`,
      });
    }

    // Precheck succeeded
    const successResult = {
      addressValid: true,
      amountValid: true,
      tokenAddressValid: true,
      userBalance: userBalance.toString(),
      estimatedGas: estimatedGas.toString(),
    };

    console.log(
      '[@agentic-ai/vincent-ability-erc20-transfer/precheck] ✅ Success result:',
      successResult,
    );
    const successResponse = succeed(successResult);
    console.log(
      '[ERC20TransferAbility/precheck] ✅ Success response:',
      JSON.stringify(successResponse, null, 2),
    );
    return successResponse;
  },

  execute: async ({ abilityParams }, { succeed, fail, delegation, policiesContext }) => {
    try {
      const {
        to,
        amount,
        tokenAddress,
        chain,
        alchemyGasSponsor,
        alchemyGasSponsorApiKey,
        alchemyGasSponsorPolicyId,
      } = abilityParams;

      console.log(
        '[@agentic-ai/vincent-ability-erc20-transfer/execute] 🚀 Executing ERC-20 Transfer Ability',
        {
          to,
          amount,
          tokenAddress,
          chain,
        },
      );

      if (alchemyGasSponsor && (!alchemyGasSponsorApiKey || !alchemyGasSponsorPolicyId)) {
        return fail({
          error:
            '[@lit-protocol/vincent-ability-erc20-transfer/execute] Alchemy gas sponsor is enabled, but missing Alchemy API key or policy ID',
        });
      }

      let provider: ethers.providers.JsonRpcProvider;
      try {
        provider = new ethers.providers.JsonRpcProvider(await Lit.Actions.getRpcUrl({ chain }));
      } catch (error) {
        console.error(
          '[@agentic-ai/vincent-ability-erc20-transfer/execute] Provider error:',
          error,
        );
        throw new Error('Unable to obtain blockchain provider for transfer operations');
      }
      const { chainId } = await provider.getNetwork();
      const erc20Contract = getErc20Contract(provider, tokenAddress);

      console.log('[@agentic-ai/vincent-ability-erc20-transfer/execute] ⛓️ Using Chain:', chain);

      // Get decimals
      const tokenDecimals = await erc20Contract.decimals();
      console.log(
        '[@agentic-ai/vincent-ability-erc20-transfer/execute] 🔢 Using token decimals:',
        tokenDecimals,
      );

      // Parse amount to token units using decimals
      const tokenAmountInSmallestUnit = ethers.utils.parseUnits(amount, tokenDecimals);
      console.log(
        '[@agentic-ai/vincent-ability-erc20-transfer/execute] 💰 Transfer amount in smallest unit:',
        tokenAmountInSmallestUnit.toString(),
      );

      // Prepare contract call data for ERC-20 transfer
      const contractCallData = {
        provider,
        pkpPublicKey: delegation.delegatorPkpInfo.publicKey,
        callerAddress: delegation.delegatorPkpInfo.ethAddress,
        contractAddress: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [to, tokenAmountInSmallestUnit],
        chainId,
        alchemyGasSponsor,
        alchemyGasSponsorApiKey,
        alchemyGasSponsorPolicyId,
      };

      console.log(
        '[@agentic-ai/vincent-ability-erc20-transfer/execute] 🔧 Full contractCallData:',
        JSON.stringify(contractCallData, null, 2),
      );

      console.log(
        '[@agentic-ai/vincent-ability-erc20-transfer/execute] 🚀 Attempting contract call...',
      );

      // Commit policy changes to the blockchain. We do this before to prioritize updating the policy over the transfer transaction
      const policyCommitResults = await commitAllowedPolicies(
        policiesContext,
        '[@agentic-ai/vincent-ability-erc20-transfer/execute]',
      );

      console.log(
        '[@agentic-ai/vincent-ability-erc20-transfer/execute] ✅ Policy commit results:',
        policyCommitResults,
      );

      // Execute the ERC-20 transfer using laUtils
      const txHash = await executeOperation(contractCallData);

      console.log(
        '[@agentic-ai/vincent-ability-erc20-transfer/execute] ✅ Contract call completed, txHash:',
        txHash,
      );

      console.log(
        '[@agentic-ai/vincent-ability-erc20-transfer/execute] ✅ ERC-20 transfer successful',
        {
          txHash,
          to,
          amount,
          tokenAddress,
        },
      );

      return succeed({
        txHash,
        to,
        amount,
        tokenAddress,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(
        '[@agentic-ai/vincent-ability-erc20-transfer/execute] ❌ ERC-20 transfer failed',
        error,
      );

      // Provide more specific error messages for common ERC-20 failures
      let errorMessage =
        '[@agentic-ai/vincent-ability-erc20-transfer/execute] ❌ Unknown error occurred';

      if (error instanceof Error) {
        errorMessage = `[@agentic-ai/vincent-ability-erc20-transfer/execute] ❌ ${error.message}`;
      }

      return fail({
        error: errorMessage,
      });
    }
  },
});
