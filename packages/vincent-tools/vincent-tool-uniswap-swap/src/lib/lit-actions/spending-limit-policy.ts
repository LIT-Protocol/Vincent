/* eslint-disable */
import { ethers } from 'ethers';
import { type Policy } from '@lit-protocol/vincent-tool';

import { getOnChainPolicyParams, getTokenAmountInUsd, sendSpendTx, validatePolicyIsPermitted } from './utils';

declare global {
  // Required Inputs
  const parentToolIpfsCid: string;
  const userRpcUrl: string;
  const vincentAppId: string;
  const vincentAppVersion: string;
  const userPkpInfo: { tokenId: string, ethAddress: string, publicKey: string };
  const policy: Policy;

  // This is being passed as a parameter and is the
  // Lit jsParams given to the Tool Lit Action
  // const toolParams: {
  //   pkpEthAddress: string;
  //   rpcUrl: string;
  //   chainId: string;
  //   tokenIn: string;
  //   tokenOut: string;
  //   amountIn: string;
  //   tokenInDecimals: string;
  //   tokenOutDecimals: string;
  // };
}

(async () => {
  const policySuccessDetails = [];

  const yellowstoneProvider = new ethers.providers.JsonRpcProvider(
    await Lit.Actions.getRpcUrl({
      chain: 'yellowstone',
    })
  );

  const policyValidationResult = await validatePolicyIsPermitted(yellowstoneProvider, userPkpInfo.tokenId, parentToolIpfsCid);
  if ('allow' in policyValidationResult && !policyValidationResult.allow) {
    Lit.Actions.setResponse({
      response: JSON.stringify(policyValidationResult),
    });
    return;
  }

  policySuccessDetails.push(...policyValidationResult.details);

  const onChainPolicyParamsResult = getOnChainPolicyParams(policy.parameters);
  if ('allow' in onChainPolicyParamsResult && !onChainPolicyParamsResult.allow) {
    Lit.Actions.setResponse({
      response: JSON.stringify(onChainPolicyParamsResult),
    });
    return;
  }

  const { maxDailySpendingLimitInUsdCents } = onChainPolicyParamsResult as { maxDailySpendingLimitInUsdCents?: ethers.BigNumber | undefined; };

  if (maxDailySpendingLimitInUsdCents) {
    console.log(`Retrieved maxDailySpendingLimitInUsdCents: ${maxDailySpendingLimitInUsdCents.toString()}`);

    const userRpcProvider = new ethers.providers.JsonRpcProvider(userRpcUrl);

    const tokenAmountInUsdResponse = await getTokenAmountInUsd(
      userRpcProvider,
      toolParams.chainId,
      toolParams.amountIn,
      toolParams.tokenIn,
      toolParams.tokenInDecimals
    )

    if ('status' in tokenAmountInUsdResponse && tokenAmountInUsdResponse.status === 'error') {
      Lit.Actions.setResponse({
        response: JSON.stringify(tokenAmountInUsdResponse),
      });
      return;
    }

    const { amountInUsd: tokenAmountInUsd } = tokenAmountInUsdResponse as { amountInUsd: ethers.BigNumber };

    // maxDailySpendingLimitInUsdCents has 2 decimal precision, but tokenAmountInUsd has 8,
    // so we multiply by 10^6 to match the precision
    const adjustedMaxDailySpendingLimit = maxDailySpendingLimitInUsdCents.mul(ethers.BigNumber.from(1_000_000));
    console.log(`Adjusted maxDailySpendingLimitInUsdCents to 8 decimal precision: ${adjustedMaxDailySpendingLimit.toString()}`);

    policySuccessDetails.push(`Spending ${tokenAmountInUsd.toString()} USD for App ID: ${vincentAppId} when the max daily spending limit is ${adjustedMaxDailySpendingLimit.toString()} USD`);

    const spendTxResponse = await sendSpendTx(
      yellowstoneProvider,
      vincentAppId,
      tokenAmountInUsd,
      adjustedMaxDailySpendingLimit,
      ethers.BigNumber.from(86400), // number of seconds in a day
      userPkpInfo.ethAddress,
      userPkpInfo.publicKey
    );

    if ('allow' in spendTxResponse && !spendTxResponse.allow) {
      console.log(`Spending limit exceeded. tokenAmountInUsd: ${tokenAmountInUsd.toString()} adjustedMaxDailySpendingLimit: ${adjustedMaxDailySpendingLimit.toString()}`);

      Lit.Actions.setResponse({
        response: JSON.stringify({
          allow: false,
          details: [
            'Spending limit exceeded',
            `Attempting to spend ${tokenAmountInUsd.toString()} USD for App ID: ${vincentAppId} when the max daily spending limit is ${adjustedMaxDailySpendingLimit.toString()} USD`
          ]
        }),
      });
      return;
    }

    if ('status' in spendTxResponse && spendTxResponse.status === 'error') {
      Lit.Actions.setResponse({
        response: JSON.stringify(spendTxResponse),
      });
      return;
    }

    console.log(`Spend transaction hash: ${spendTxResponse.details[0]}`);
    policySuccessDetails.push(`Spend transaction hash: ${spendTxResponse.details[0]}`);
  } else {
    console.log(`No maxDailySpendingLimitInUsdCents set on-chain for App ID: ${vincentAppId} App Version: ${vincentAppVersion} Tool: ${parentToolIpfsCid} PKP token ID: ${userPkpInfo.tokenId} Delegatee: ${userPkpInfo.ethAddress}`);
    policySuccessDetails.push(`No maxDailySpendingLimitInUsdCents set on-chain for App ID: ${vincentAppId} App Version: ${vincentAppVersion} Tool: ${parentToolIpfsCid} PKP token ID: ${userPkpInfo.tokenId} Delegatee: ${userPkpInfo.ethAddress}`);
  }

  console.log(`Policy ${policy.policyIpfsCid} executed successfully`);
  policySuccessDetails.push(`Policy ${policy.policyIpfsCid} executed successfully`);

  Lit.Actions.setResponse({
    response: JSON.stringify({
      allow: true,
      details: policySuccessDetails,
    }),
  });
})();