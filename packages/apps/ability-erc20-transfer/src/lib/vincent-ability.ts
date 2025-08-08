import {
  createVincentAbility,
  createVincentAbilityPolicy,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { bundledVincentPolicy } from '@lit-protocol/vincent-policy-send-counter';
import { laUtils } from '@lit-protocol/vincent-scaffold-sdk';
import { ethers } from 'ethers';

import {
  ERC20_ABI,
  getErc20Contract,
  isValidAddress,
  isValidAmount,
  parseTokenAmount,
} from './helpers';
import { commitAllowedPolicies } from './helpers/commit-allowed-policies';
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

  precheck: async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    console.log('[@agentic-ai/vincent-ability-erc20-transfer/precheck] 🔍 Starting validation');
    console.log('[@agentic-ai/vincent-ability-erc20-transfer/precheck] 📋 params:', {
      abilityParams,
    });

    const { to, amount, tokenAddress, rpcUrl } = abilityParams;

    // Validate recipient address
    if (!isValidAddress(to)) {
      return fail({
        error:
          '[@agentic-ai/vincent-ability-erc20-transfer/precheck] ❌ Invalid recipient address format',
      });
    }

    // Validate amount
    if (!isValidAmount(amount)) {
      return fail({
        error:
          '[@agentic-ai/vincent-ability-erc20-transfer/precheck] ❌ Invalid amount format or amount must be greater than 0',
      });
    }

    // Validate token contract address
    if (!isValidAddress(tokenAddress)) {
      return fail({
        error:
          '[@agentic-ai/vincent-ability-erc20-transfer/precheck] ❌ Invalid token contract address format',
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
    const tokenAmountInWei = parseTokenAmount(amount, tokenDecimals);
    const pkpAddress = delegatorPkpInfo.ethAddress;
    if (!pkpAddress) {
      return fail({
        error:
          '[@agentic-ai/vincent-ability-erc20-transfer/precheck] ❌ PKP public key not available',
      });
    }

    // Check token balance
    const userBalance = await erc20Contract.balanceOf(pkpAddress);
    if (userBalance.lt(tokenAmountInWei)) {
      return fail({
        error: `[@agentic-ai/vincent-ability-erc20-transfer/precheck] ❌ Insufficient token balance. Need ${ethers.utils.formatUnits(tokenAmountInWei, tokenDecimals)} tokens, but only have ${ethers.utils.formatUnits(userBalance, tokenDecimals)} tokens`,
      });
    }

    // Estimate transfer gas and check there is enough
    const estimatedGas = await erc20Contract.estimateGas.transfer(to, amount);
    const nativeBalance = await provider.getBalance(pkpAddress);
    if (nativeBalance.lt(estimatedGas)) {
      return fail({
        error: `[@agentic-ai/vincent-ability-erc20-transfer/precheck] ❌ In7702 on the approval abilitysufficient gas. Need ${estimatedGas.toString()} gas, but only have ${nativeBalance.toString()} gas`,
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
      const { to, amount, tokenAddress, chain } = abilityParams;

      console.log(
        '[@agentic-ai/vincent-ability-erc20-transfer/execute] 🚀 Executing ERC-20 Transfer Ability',
        {
          to,
          amount,
          tokenAddress,
          chain,
        },
      );

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

      // Get PKP public key from delegation context
      const pkpPublicKey = delegation.delegatorPkpInfo.publicKey;
      if (!pkpPublicKey) {
        throw new Error('PKP public key not available from delegation context');
      }
      const pkpAddress = ethers.utils.computeAddress(pkpPublicKey);
      console.log(
        '[@agentic-ai/vincent-ability-erc20-transfer/execute] 🔑 PKP wallet address:',
        pkpAddress,
      );

      // Get decimals
      const tokenDecimals = await erc20Contract.decimals();
      console.log(
        '[@agentic-ai/vincent-ability-erc20-transfer/execute] 🔢 Using token decimals:',
        tokenDecimals,
      );

      // Parse amount to token units using decimals
      const tokenAmountInWei = parseTokenAmount(amount, tokenDecimals);
      console.log(
        '[@agentic-ai/vincent-ability-erc20-transfer/execute] 💰 Transfer amount:',
        ethers.utils.formatUnits(tokenAmountInWei, tokenDecimals),
      );

      // Prepare contract call data for ERC-20 transfer
      const contractCallData = {
        provider,
        pkpPublicKey,
        callerAddress: pkpAddress,
        contractAddress: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [to, tokenAmountInWei],
        chainId,
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
      const txHash = await laUtils.transaction.handler.contractCall(contractCallData);

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
