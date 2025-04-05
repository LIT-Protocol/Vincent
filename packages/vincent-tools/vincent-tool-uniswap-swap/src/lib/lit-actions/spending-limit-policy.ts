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
  const yellowstoneProvider = new ethers.providers.JsonRpcProvider(
    await Lit.Actions.getRpcUrl({
      chain: 'yellowstone',
    })
  );

  await validatePolicyIsPermitted(yellowstoneProvider, userPkpInfo.tokenId, parentToolIpfsCid);

  const {
    maxDailySpendingLimitInUsdCents,
  } = getOnChainPolicyParams(policy.parameters);

  console.log(`Retrieved maxDailySpendingLimitInUsdCents: ${maxDailySpendingLimitInUsdCents?.toString()}`);

  const userRpcProvider = new ethers.providers.JsonRpcProvider(userRpcUrl);

  const tokenAmountInUsd = await getTokenAmountInUsd(
    userRpcProvider,
    toolParams.chainId,
    toolParams.amountIn,
    toolParams.tokenIn,
    toolParams.tokenInDecimals
  )

  if (maxDailySpendingLimitInUsdCents) {
    // maxDailySpendingLimitInUsdCents has 2 decimal precision, but tokenAmountInUsd has 8,
    // so we multiply by 10^6 to match the precision
    const adjustedMaxDailySpendingLimit = maxDailySpendingLimitInUsdCents.mul(ethers.BigNumber.from(1_000_000));
    console.log(`Adjusted maxDailySpendingLimitInUsdCents to 8 decimal precision: ${adjustedMaxDailySpendingLimit.toString()}`);

    const spendTxHash = await sendSpendTx(
      yellowstoneProvider,
      vincentAppId,
      tokenAmountInUsd,
      adjustedMaxDailySpendingLimit,
      ethers.BigNumber.from(86400), // number of seconds in a day
      userPkpInfo.ethAddress,
      userPkpInfo.publicKey
    );
    console.log(`Spend transaction hash: ${spendTxHash}`);
  }

  console.log(`Policy ${policy.policyIpfsCid} executed successfully`);
})();